# Sistema para administrar paquetes y ventas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive Spanish React application backed by Supabase for package inventory, expenses, Excel/CSV imports, sales, and profit summaries.

**Architecture:** Use a Vite React TypeScript single-page application. Supabase Auth identifies users; Postgres tables with row-level security hold each user's packages and transactions. Postgres RPC functions perform sales and batch imports atomically, while focused client modules parse spreadsheets and derive display summaries.

**Tech Stack:** React, TypeScript, Vite, Supabase JS client, Supabase Postgres/Auth, SheetJS (`xlsx`) for `.xlsx` and CSV parsing, React Router, CSS, npm.

**Spec:** `docs/superpowers/specs/2026-10-08-paquetes-ventas-design.md`

## Global Constraints

- “La aplicación tendrá inicio y cierre de sesión con correo y contraseña mediante Supabase Auth.”
- “Cada usuario solo podrá leer y modificar sus propios datos.”
- “Los importes se mostrarán en dólares estadounidenses (USD).”
- “La importación aceptará archivos `.xlsx` y `.csv` con columnas `Producto`, `Cantidad`, `Precio de compra` y `Precio de venta`.”
- “El usuario podrá corregir o excluir filas problemáticas, confirmar la importación o cancelarla.”
- “La aplicación no permitirá registrar una venta que supere las unidades disponibles.”
- “La confirmación de una venta deberá guardar la venta y descontar inventario como una sola operación consistente.”
- “La importación confirmada deberá guardar sus filas como una sola operación consistente.”
- “No se presentará un cambio como guardado hasta recibir confirmación.”

## Review Focus

- Two users attempt to read or mutate another user's package; RLS rejects access. Verify with two authenticated sessions.
- Two sales concurrently request the last available units; the atomic RPC allows at most one valid sale. Verify by issuing concurrent requests against a one-unit product.
- A network timeout happens after import persistence but before the client receives a response; retry with the same import batch ID without duplicating products. Verify by retrying the exact RPC payload.
- Spreadsheet headers have extra whitespace, reordered columns, blank rows, malformed numbers, or negative values; preview reports actionable row errors and never silently imports invalid data. Verify using a fixture spreadsheet.
- A user cancels an import or a database write fails; no partial rows appear and the UI retains entered data with a clear error. Verify cancellation and simulate a rejected request.

---

### Task 1: Scaffold the React application and shared foundation

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles/global.css`
- Create: `.env.example`, `.gitignore`

**Interfaces:**
- Produces: Vite React TypeScript application; `src/App.tsx` is the top-level router/layout entry; `.env.example` defines `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

- [ ] **Step 1: Create the Vite React TypeScript scaffold**

Add `react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, and `xlsx` dependencies. Configure scripts `dev`, `build`, and `preview`. Add `.env.local` to `.gitignore` and put placeholder Supabase variable names in `.env.example`.

- [ ] **Step 2: Add the application entry and route shell**

Create `src/main.tsx` to mount `App` and import global styles. Configure routes for `/login`, `/`, `/packages/new`, `/packages/:packageId`, and `/packages/:packageId/sales/new`; route bodies can be simple named placeholders until their owning tasks.

- [ ] **Step 3: Add shared visual tokens and responsive base styles**

Define color, spacing, typography, focus, button, form-control, page-width, and breakpoint rules in `src/styles/global.css`. Use semantic HTML and visible keyboard focus.

- [ ] **Step 4: Verify the scaffold builds**

Run: `npm run build`
Expected: Vite completes a production build without TypeScript errors.

### Task 2: Define the Supabase schema, row security, and atomic operations

**Files:**
- Create: `supabase/migrations/202610080001_initial_schema.sql`
- Create: `src/lib/supabase.ts`
- Create: `src/types/database.ts`

**Interfaces:**
- Produces: tables `packages`, `products`, `expenses`, `sales`, and `import_batches`; client singleton `supabase`; RPC `record_sale(p_package_id uuid, p_product_id uuid, p_quantity integer, p_unit_price numeric, p_sold_at timestamptz) -> jsonb`; RPC `import_products(p_batch_id uuid, p_package_id uuid, p_rows jsonb) -> integer`.
- Consumes: Vite environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Task 1.

- [ ] **Step 1: Write migration tables, constraints, and indexes**

Use UUID primary keys. Packages store `user_id`, name, destination, package date, optional notes, and timestamps. Products store package/user IDs, name, initial quantity, purchase unit price, and sale unit price. Expenses store package/user IDs, description, amount, optional note/category. Sales store package/user/product IDs, quantity, applied unit price, sale time, and batch-independent unique ID. Import batches store batch UUID, package/user IDs, row count, and creation time. Use nonnegative price constraints, positive quantities and indexes for owner/package/date lookups.

- [ ] **Step 2: Add RLS and ownership policies**

Enable RLS on all five tables. Each select/insert/update/delete policy must require `user_id = auth.uid()`; package child policies also require that the referenced package belongs to the same authenticated user. Grant authenticated users only the required table operations.

- [ ] **Step 3: Add `record_sale` atomic RPC**

Implement a `SECURITY INVOKER` PostgreSQL function that locks the product row, confirms the package/product relationship and owner, calculates available inventory as initial quantity minus recorded sale quantities, rejects nonpositive or excessive quantities, inserts the sale, and returns the saved sale plus remaining quantity. Keep it in a single transaction and ensure function execution respects RLS.

- [ ] **Step 4: Add idempotent `import_products` atomic RPC**

Implement a `SECURITY INVOKER` function that claims `p_batch_id` under a unique constraint for the authenticated user, verifies package ownership, inserts the validated rows in one transaction, and returns the inserted row count. Repeating the same batch ID must return the original result without inserting duplicate rows.

- [ ] **Step 5: Add typed client configuration**

Create the Supabase client from the two Vite environment variables and define the TypeScript record types used by the UI. When variables are missing, show a clear configuration error rather than failing during module initialization.

- [ ] **Step 6: Review SQL access paths and build**

Manually inspect every policy and RPC for cross-user access and transaction boundaries. Run: `npm run build`
Expected: client compiles; SQL review confirms policies and RPC definitions are syntactically complete before applying the migration in the Supabase project.

### Task 3: Implement authentication and protected navigation

**Files:**
- Create: `src/features/auth/AuthProvider.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/auth/ProtectedRoute.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`.
- Produces: `AuthProvider` context with `user`, `loading`, `signIn(email, password)`, and `signOut()`; protected route redirects unauthenticated users to `/login`.

- [ ] **Step 1: Implement auth session state and actions**

Subscribe to Supabase auth changes, load the initial session, and unsubscribe on unmount. Expose loading and user state, plus email/password sign-in and sign-out actions.

- [ ] **Step 2: Build the Spanish login screen**

Add labeled email and password fields, submit/loading states, keyboard-friendly validation, and a clear Spanish message for invalid credentials or connection errors.

- [ ] **Step 3: Protect application routes and add sign out**

Wrap package, dashboard, and sales routes in `ProtectedRoute`. Keep `/login` public and provide a visible sign-out action after login.

- [ ] **Step 4: Verify authentication flow**

Run: `npm run build`
Manual verification: signed-out visits redirect to `/login`; valid Supabase credentials open the app; sign out returns to `/login`; invalid credentials leave a Spanish error message.

### Task 4: Build package creation, listing, and detail loading

**Files:**
- Create: `src/features/packages/packageApi.ts`, `src/features/packages/PackagesPage.tsx`, `src/features/packages/PackageForm.tsx`, `src/features/packages/PackageDetailPage.tsx`
- Create: `src/components/AppShell.tsx`, `src/components/LoadingState.tsx`, `src/components/EmptyState.tsx`, `src/lib/currency.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: authenticated `user` and `supabase` client.
- Produces: `createPackage(input): Promise<Package>`; `listPackages(): Promise<Package[]>`; `getPackageDetails(packageId): Promise<PackageDetails>`; USD formatter `formatUSD(value: number): string`.

- [ ] **Step 1: Implement package API and typed database mapping**

Create/select packages scoped by RLS with fields `name`, `destination`, `package_date`, and optional `notes`. Return Supabase errors as user-safe errors.

- [ ] **Step 2: Build package list and create form**

Show a useful empty state and a clear “Crear nuevo paquete” action. Validate required name, destination, and date. On success navigate to the new package detail; on failure retain form values and show an error.

- [ ] **Step 3: Build application shell and package detail loading**

Add Spanish navigation, current user/sign-out area, loading/error states, and package detail header. Handle unknown or inaccessible package IDs with a not-found state.

- [ ] **Step 4: Verify package flows and responsive layout**

Run: `npm run build`
Manual verification: create two packages, reload and confirm both persist, open each detail, and check that an unknown package shows a not-found state at desktop and phone widths.

### Task 5: Add product management, import preview, and package summaries

**Files:**
- Create: `src/features/products/productApi.ts`, `src/features/products/ProductForm.tsx`, `src/features/products/ProductTable.tsx`
- Create: `src/features/import/importApi.ts`, `src/features/import/parseProductsFile.ts`, `src/features/import/ImportProductsDialog.tsx`, `public/plantilla-productos.csv`
- Create: `src/features/packages/packageCalculations.ts`
- Modify: `src/features/packages/PackageDetailPage.tsx`

**Interfaces:**
- Produces: `ProductImportRow = { rowNumber: number; name: string; quantity: number; purchaseUnitPrice: number; saleUnitPrice: number }`; `parseProductsFile(file: File): Promise<{ rows: ProductImportRow[]; issues: ImportIssue[] }>`; `calculatePackageSummary(details: PackageDetails): PackageSummary`.
- Consumes: package API and database records from Tasks 2 and 4.

- [ ] **Step 1: Implement manual product CRUD and inventory display**

Add products with name, positive initial quantity, nonnegative purchase price and sale price. Allow edit/delete while no sales reference the product. Display initial, sold, and available quantities; calculate sold/available using sales records.

- [ ] **Step 2: Implement Excel/CSV parsing and input validation**

Normalize header whitespace and case and map the four required columns regardless of order. Ignore blank rows. Return actionable issues with source row numbers for missing headers, missing names, non-integer/nonpositive quantities, and invalid/negative prices. Do not write to Supabase from the parser.

- [ ] **Step 3: Build editable import preview and sample download**

Allow `.xlsx` and `.csv` selection, show valid rows and row issues, let the user correct or exclude rows, and provide a downloadable CSV template. Cancel closes the dialog without database calls. Disable confirmation if no valid rows remain.

- [ ] **Step 4: Persist confirmed imports atomically**

Create one UUID batch ID for each confirmation attempt and call `import_products` with the corrected valid rows. Reuse that batch ID on transport retry. Close the dialog and refresh products only after confirmed success; on failure keep the preview and corrections in place.

- [ ] **Step 5: Implement package calculation selectors**

Implement total product purchase cost, potential sale value for initial inventory, additional expense total, total investment, received sales revenue, sold product cost, expected profit, and actual profit using the exact formulas in the spec. Format display values through `formatUSD`.

- [ ] **Step 6: Verify product/import/summary cases**

Run: `npm run build`
Manual verification: add/edit/delete a product, import a reordered-header workbook, correct an invalid row, cancel without writes, confirm import, retry the same batch ID without duplicate rows, and reconcile summary values with a hand-calculated example.

### Task 6: Add package expenses and atomic sales registration

**Files:**
- Create: `src/features/expenses/expenseApi.ts`, `src/features/expenses/ExpenseForm.tsx`, `src/features/expenses/ExpenseList.tsx`
- Create: `src/features/sales/salesApi.ts`, `src/features/sales/RegisterSalePage.tsx`, `src/features/sales/SalesHistory.tsx`
- Modify: `src/features/packages/PackageDetailPage.tsx`, `src/features/packages/packageCalculations.ts`, `src/App.tsx`

**Interfaces:**
- Consumes: `record_sale` RPC and package/product summary interfaces from earlier tasks.
- Produces: `addExpense(input): Promise<Expense>`; `listExpenses(packageId): Promise<Expense[]>`; `recordSale(input): Promise<SaleResult>`; `listSales(packageId): Promise<Sale[]>`.

- [ ] **Step 1: Implement expense entry and list**

Support description, amount, optional note and optional category (shipping, transport, tax, other, or custom text). Refresh expense totals only after insert succeeds.

- [ ] **Step 2: Implement sales API using the atomic RPC**

Call `record_sale` with package, product, quantity, applied unit price, and current timestamp. Convert inventory validation failures into a clear Spanish message and refresh product availability and sales only after success.

- [ ] **Step 3: Build sale form and sales history**

Show available quantities, suggest the product's configured sale price, allow confirmation/adjustment of unit price, validate quantity and amount, and show a review summary before submit. Display dated sales history with product, units, unit price, and total.

- [ ] **Step 4: Connect expense and sale data to details and calculations**

Display expense and sale sections on package detail. Recompute expenses, received revenue, sold cost, remaining stock, and actual profit from persisted data after each successful operation.

- [ ] **Step 5: Verify sales and expense flows**

Run: `npm run build`
Manual verification: add multiple expenses, record a partial sale, reload and verify history/totals/inventory; attempt to sell more than available and confirm no sale is stored; check a failed RPC retains the submitted form values.

### Task 7: Complete dashboard, accessibility, and end-to-end review

**Files:**
- Create: `src/features/dashboard/DashboardPage.tsx`, `src/features/dashboard/dashboardApi.ts`
- Modify: `src/App.tsx`, `src/styles/global.css`, feature pages and components as needed.

**Interfaces:**
- Consumes: package detail, expense, sales, and calculation interfaces from Tasks 4–6.
- Produces: authenticated dashboard cards and package links covering the full acceptance criteria.

- [ ] **Step 1: Build dashboard summaries from persisted package data**

Aggregate money invested in purchases, additional expenses, potential sale revenue, expected profit, money received from recorded sales, and actual profit across the authenticated user's packages. Reuse `calculatePackageSummary` so dashboard and detail formulas agree.

- [ ] **Step 2: Finish loading, empty, and error states**

Every list/detail/form must distinguish loading, no data, saved, and failed states. Avoid clearing user input after a failed request and avoid optimistic “saved” messaging.

- [ ] **Step 3: Review Spanish copy, responsive tables, and keyboard access**

Check headings, button labels, labels/descriptions, focus order, dialog keyboard behavior, table overflow on phones, USD formatting, and status/error messages.

- [ ] **Step 4: Perform final acceptance walkthrough**

Run: `npm run build`
Manual verification: complete the acceptance criteria in the spec from login through package creation, manual and imported products, expenses, sales, dashboard, reload persistence, and a second user's data isolation. Record any Supabase setup prerequisites still needed for deployment.

## Execution notes

- The workspace currently has no Git repository or existing application files. Do not assume an existing branch, scripts, or Supabase project configuration.
- Before runtime setup, obtain a Supabase project URL and anonymous key in local environment variables; never commit secrets.
- Apply the SQL migration to the configured Supabase project before attempting authenticated data flows.
- This plan does not include test-suite creation or execution; it uses production-build checks and the manual acceptance walkthrough.
