# Sistema para administrar paquetes y ventas

## Objetivo

Crear una aplicación web sencilla, en español, para que vendedores armen paquetes de productos, administren inventario y gastos, registren ventas y consulten el dinero invertido y las ganancias. Debe ser fácil de aprender y funcionar en computadoras y teléfonos.

## Usuarios y acceso

- La aplicación tendrá inicio y cierre de sesión con correo y contraseña mediante Supabase Auth.
- Cada usuario solo podrá leer y modificar sus propios datos.
- La base de datos aplicará políticas de seguridad por usuario para paquetes, productos, gastos y ventas.
- Los importes se mostrarán en dólares estadounidenses (USD).

## Navegación y pantallas

1. **Inicio de sesión:** acceso con correo y contraseña y opción de cerrar sesión.
2. **Resumen:** muestra el dinero invertido en compras, gastos adicionales, dinero que se recibiría si se vende todo el inventario, ganancia esperada, dinero recibido por ventas registradas y ganancia real.
3. **Paquetes:** lista de paquetes existentes y acción visible para crear uno.
4. **Crear paquete:** formulario breve con nombre, lugar de envío, fecha y notas opcionales.
5. **Detalle del paquete:** información del paquete, lista completa de productos y cantidades enviadas, vendidas y disponibles, precios de compra y venta, gastos adicionales, totales y ganancia.
6. **Registrar venta:** selección de productos del paquete, unidades y precio de venta confirmado. La fecha se guarda al registrar la venta.

## Paquetes y productos

- Cada paquete pertenece a un usuario y contiene sus productos, gastos y ventas.
- Se podrán añadir productos manualmente con nombre, cantidad, precio de compra unitario y precio de venta unitario.
- Los productos podrán modificarse o eliminarse antes de continuar con la gestión del paquete.
- El inventario disponible de cada producto será cantidad inicial menos unidades vendidas.
- La aplicación no permitirá registrar una venta que supere las unidades disponibles.

## Importación desde Excel

- La importación aceptará archivos `.xlsx` y `.csv` con columnas `Producto`, `Cantidad`, `Precio de compra` y `Precio de venta`.
- Se permitirá seleccionar un archivo de ejemplo descargable.
- El archivo se analizará en el navegador y se presentará una vista previa antes de escribir en Supabase.
- La vista previa mostrará filas válidas y errores de datos, incluidos valores incompletos o cantidades y precios inválidos.
- El usuario podrá corregir o excluir filas problemáticas, confirmar la importación o cancelarla.
- La importación confirmada se guardará como una operación completa. La aplicación deberá evitar duplicar el mismo lote si el usuario reintenta la misma confirmación.

## Gastos

- Se podrán registrar varios gastos por paquete.
- Cada gasto tendrá una descripción y un monto; la nota será opcional.
- La interfaz puede ofrecer categorías iniciales como envío, transporte, impuestos y otros, sin impedir descripciones propias.
- El total de gastos adicionales será la suma de los gastos del paquete.

## Ventas y cálculos

- Una venta guardará el paquete, producto, cantidad, precio unitario aplicado, fecha y total recibido.
- El precio unitario de venta sugerido será el configurado para el producto; el vendedor podrá confirmarlo o ajustarlo al registrar la venta.
- Total de compra de productos = suma de cantidad inicial × precio de compra unitario.
- Venta potencial del inventario inicial = suma de cantidad inicial × precio de venta unitario.
- Inversión total del paquete = costo total de compra de productos + gastos adicionales.
- Dinero recibido = suma de los totales de ventas registradas.
- Costo vendido = suma de cantidad vendida × precio de compra unitario del producto.
- Ganancia real = dinero recibido − costo vendido − gastos adicionales del paquete.
- Ganancia esperada al vender todo = venta potencial del inventario inicial − inversión total.
- Las tarjetas de resumen se derivarán de los paquetes y transacciones guardados para reflejar cada cambio confirmado.

## Persistencia e integridad

- React será la interfaz y Supabase será la capa de autenticación y persistencia.
- Los cambios confirmados se guardarán en Supabase y permanecerán después de cerrar o recargar la aplicación.
- La confirmación de una venta deberá guardar la venta y descontar inventario como una sola operación consistente.
- La importación confirmada deberá guardar sus filas como una sola operación consistente.
- Se mostrarán estados de carga, confirmaciones y mensajes comprensibles cuando falle una operación; no se presentará un cambio como guardado hasta recibir confirmación.

## Diseño de interfaz

- Interfaz limpia y moderna en español, con navegación simple y botones claros.
- Formularios cortos y tablas legibles en pantallas pequeñas y grandes.
- Los indicadores y totales usarán nombres cotidianos, por ejemplo: “Dinero invertido”, “Dinero recibido” y “Ganancia real”.
- Las acciones que cambian datos mostrarán una confirmación o un resumen cuando sea útil, particularmente antes de importar productos o registrar una venta.
- Los errores explicarán cómo corregir los datos, evitando mensajes técnicos innecesarios.

## Fuera del alcance inicial

- Pagos en línea, facturación fiscal, múltiples monedas, contabilidad avanzada, roles de equipo y sincronización con tiendas externas.
- No se presupone una función de exportación ni edición de ventas ya confirmadas; estas decisiones podrán definirse después si se requieren.

## Criterios de aceptación

1. Un usuario puede iniciar sesión y solo ve los datos de sus propios paquetes.
2. Puede crear un paquete y añadir, editar o eliminar productos manualmente.
3. Puede descargar un ejemplo, seleccionar un archivo Excel o CSV, revisar errores y confirmar o cancelar la importación sin duplicar filas al reintentar la misma operación.
4. Puede agregar varios gastos a un paquete y ver su suma reflejada en los totales.
5. Puede registrar ventas, el sistema impide vender más unidades de las disponibles y actualiza el inventario y el resumen.
6. El detalle del paquete y el resumen muestran importes coherentes con las fórmulas definidas.
7. Los datos confirmados persisten al recargar la aplicación.
8. Los flujos principales se pueden usar desde una computadora y un teléfono, con textos y errores en español.
