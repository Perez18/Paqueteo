create extension if not exists pgcrypto;

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  destination text not null check (length(trim(destination)) > 0),
  package_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  initial_quantity integer not null check (initial_quantity > 0),
  purchase_unit_price numeric(12, 2) not null check (purchase_unit_price >= 0),
  sale_unit_price numeric(12, 2) not null check (sale_unit_price >= 0),
  created_at timestamptz not null default now(),
  unique (id, package_id),
  foreign key (package_id, user_id) references public.packages(id, user_id) on delete cascade
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null check (length(trim(description)) > 0),
  amount numeric(12, 2) not null check (amount >= 0),
  note text,
  category text,
  created_at timestamptz not null default now(),
  foreign key (package_id, user_id) references public.packages(id, user_id) on delete cascade
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  product_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (package_id, user_id) references public.packages(id, user_id) on delete cascade,
  foreign key (product_id, package_id) references public.products(id, package_id) on delete cascade
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  package_id uuid not null references public.packages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  row_count integer not null check (row_count >= 0),
  payload_hash text not null,
  created_at timestamptz not null default now(),
  unique (user_id, batch_id),
  foreign key (package_id, user_id) references public.packages(id, user_id) on delete cascade
);

create index if not exists packages_user_created_idx on public.packages(user_id, created_at desc);
create index if not exists products_package_idx on public.products(package_id);
create index if not exists expenses_package_idx on public.expenses(package_id, created_at desc);
create index if not exists sales_product_idx on public.sales(product_id);
create index if not exists sales_package_sold_idx on public.sales(package_id, sold_at desc);

create or replace function public.prevent_sold_product_changes()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if exists (select 1 from public.sales where product_id = old.id) then
    raise exception 'PRODUCT_HAS_SALES' using errcode = '23503';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger protect_sold_product_update
before update or delete on public.products
for each row execute function public.prevent_sold_product_changes();

alter table public.packages enable row level security;
alter table public.products enable row level security;
alter table public.expenses enable row level security;
alter table public.sales enable row level security;
alter table public.import_batches enable row level security;

create policy "owners manage packages" on public.packages for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "owners manage products" on public.products for all to authenticated
  using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.packages p where p.id = package_id and p.user_id = (select auth.uid())
    )
  );
create policy "owners manage expenses" on public.expenses for all to authenticated
  using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.packages p where p.id = package_id and p.user_id = (select auth.uid())
    )
  );
create policy "owners manage sales" on public.sales for all to authenticated
  using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.packages p where p.id = package_id and p.user_id = (select auth.uid())
    )
  );
create policy "owners read import batches" on public.import_batches for select to authenticated
  using (user_id = (select auth.uid()));
create policy "owners insert import batches" on public.import_batches for insert to authenticated
  with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.packages p where p.id = package_id and p.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.packages, public.products, public.expenses to authenticated;
revoke insert, update, delete on public.sales from authenticated;
grant select on public.sales to authenticated;
grant select, insert on public.import_batches to authenticated;

create or replace function public.record_sale(
  p_package_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_unit_price numeric,
  p_sold_at timestamptz default now()
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_sold integer;
  v_sale public.sales%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  if p_quantity <= 0 or p_unit_price < 0 then
    raise exception 'INVALID_SALE' using errcode = '22023';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id and package_id = p_package_id and user_id = (select auth.uid())
  for update;

  if not found then raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0002'; end if;

  select coalesce(sum(quantity), 0)::integer into v_sold
  from public.sales where product_id = p_product_id;

  if p_quantity > v_product.initial_quantity - v_sold then
    raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
  end if;

  insert into public.sales (package_id, product_id, user_id, quantity, unit_price, sold_at)
  values (p_package_id, p_product_id, (select auth.uid()), p_quantity, p_unit_price, coalesce(p_sold_at, now()))
  returning * into v_sale;

  return jsonb_build_object(
    'sale', to_jsonb(v_sale),
    'remaining_quantity', v_product.initial_quantity - v_sold - p_quantity
  );
end;
$$;

create or replace function public.import_products(
  p_batch_id uuid,
  p_package_id uuid,
  p_rows jsonb
) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid := (select auth.uid());
  v_count integer;
  v_claimed integer;
  v_existing_hash text;
begin
  if v_owner is null then raise exception 'NOT_AUTHENTICATED' using errcode = '42501'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'ROWS_MUST_BE_ARRAY' using errcode = '22023'; end if;
  if not exists (select 1 from public.packages where id = p_package_id and user_id = v_owner) then
    raise exception 'PACKAGE_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_count := jsonb_array_length(p_rows);
  insert into public.import_batches(batch_id, package_id, user_id, row_count, payload_hash)
  values (p_batch_id, p_package_id, v_owner, v_count, md5(p_rows::text))
  on conflict (user_id, batch_id) do nothing;

  get diagnostics v_claimed = row_count;
  if v_claimed = 0 then
    select payload_hash into v_existing_hash from public.import_batches
      where batch_id = p_batch_id and package_id = p_package_id and user_id = v_owner;
    if v_existing_hash is null then raise exception 'BATCH_ID_ALREADY_USED' using errcode = '23505'; end if;
    if v_existing_hash <> md5(p_rows::text) then
      raise exception 'BATCH_PAYLOAD_MISMATCH' using errcode = '23505';
    end if;
    return (select row_count from public.import_batches where batch_id = p_batch_id and user_id = v_owner);
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_rows) as item(row_data)
    where nullif(trim(row_data->>'name'), '') is null
      or (row_data->>'quantity') !~ '^[0-9]+$'
      or (row_data->>'quantity')::integer <= 0
      or (row_data->>'purchaseUnitPrice') !~ '^[0-9]+(\.[0-9]{1,2})?$'
      or (row_data->>'saleUnitPrice') !~ '^[0-9]+(\.[0-9]{1,2})?$'
  ) then raise exception 'INVALID_IMPORT_ROW' using errcode = '22023'; end if;

  insert into public.products(package_id, user_id, name, initial_quantity, purchase_unit_price, sale_unit_price)
  select p_package_id, v_owner, trim(row_data->>'name'), (row_data->>'quantity')::integer,
    (row_data->>'purchaseUnitPrice')::numeric, (row_data->>'saleUnitPrice')::numeric
  from jsonb_array_elements(p_rows) as item(row_data);

  return v_count;
end;
$$;

revoke all on function public.record_sale(uuid, uuid, integer, numeric, timestamptz) from public;
revoke all on function public.import_products(uuid, uuid, jsonb) from public;
grant execute on function public.record_sale(uuid, uuid, integer, numeric, timestamptz) to authenticated;
grant execute on function public.import_products(uuid, uuid, jsonb) to authenticated;
