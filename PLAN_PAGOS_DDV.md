# Plan de pagos, pedidos y suscripciones DDV

Fecha: 12 de octubre de 2026
Base revisada: commit `6bbfebd`
Estado: proveedor Netlify Database aprobado; infraestructura de Fase 1 preparada localmente y no desplegada

## 1. Decisión recomendada

Mantener el sitio editorial estático actual y agregar una capa de servidor pequeña y explícita:

- **Frontend existente:** `/revista/planes/`, `/revista/pedido/` y los componentes DDV actuales.
- **Cobro:** Mercado Pago Checkout Pro mediante la **Orders API**, con pago único en CLP.
- **Backend:** Netlify Functions para crear el checkout, recibir webhooks, consultar estados y servir el panel administrativo.
- **Persistencia:** Netlify Database sobre PostgreSQL transaccional, aprobado para el plan Personal credit-based de DDV. El recurso remoto todavía no ha sido creado.
- **Administración:** panel `/admin/` protegido con acceso por invitación y rol `admin`; todas las autorizaciones se vuelven a comprobar en servidor.

Las tres ofertas actuales son cobros únicos por adelantado. Aunque dos se llamen Suscripción y Club, en esta etapa **no requieren débitos automáticos ni la API de suscripciones recurrentes de Mercado Pago**:

| Producto | SKU | Precio autorizado | Modalidad de cobro |
| --- | --- | ---: | --- |
| Caja DDV N.º 01 | `DDV-BOX-01` | $15.990 CLP | Pago único |
| Suscripción DDV | `DDV-SUB-ANUAL` | $29.990 CLP | Pago único por un año y 3 revistas |
| Club DDV | `DDV-CLUB-ANUAL` | $39.990 CLP | Pago único por un año, 3 revistas y 3 cajas |

Si DDV quisiera renovación automática al año siguiente, debe tratarse como una fase futura distinta, con consentimiento específico, avisos de renovación y un análisis separado de la API de Suscripciones.

## 2. Estado actual encontrado

- Netlify ejecuta `node scripts/verify-public-output.mjs` y publica directamente la raíz del repositorio.
- El sitio no tiene backend, API, base de datos ni sistema de autenticación.
- `editorial-products.js` contiene la presentación de los tres productos en el navegador.
- `editorial-commerce.js` selecciona el plan, pero mantiene `DDV_PAYMENT_PROVIDER.enabled = false` y bloquea el envío.
- `/revista/pedido/` contiene los campos futuros de contacto, despacho y consentimientos; hoy no tiene `action`, `method="post"` ni integración de Netlify Forms.
- `/revista/confirmacion/` no afirma que exista un pago y está correctamente marcada `noindex`.
- La tienda de insumos usa otro recorrido y no debe mezclarse con esta arquitectura.

El navegador nunca debe convertirse en la fuente de verdad para precios, despacho, inventario o estado de pago. `editorial-products.js` puede seguir alimentando la interfaz, pero el servidor debe validar todo contra su propio catálogo autorizado.

## 3. Arquitectura propuesta

```text
Cliente
  │
  │ POST /api/editorial/checkout
  ▼
Netlify Function: create-checkout
  ├─ valida producto, contacto, dirección y consentimientos
  ├─ calcula producto + despacho desde datos del servidor
  ├─ crea cliente y pedido draft/payment_pending
  ├─ crea Order en Mercado Pago con idempotencia
  └─ devuelve checkout_url
  │
  ▼
Checkout Pro de Mercado Pago
  │
  ├─ redirección de vuelta (solo informativa)
  │
  └─ webhook firmado (fuente operativa)
       ▼
Netlify Function: mercadopago-webhook
  ├─ valida x-signature
  ├─ vuelve a consultar la Order a Mercado Pago
  ├─ compara ID, referencia, monto, moneda y estado
  ├─ actualiza pago y pedido en transacción
  ├─ crea entregas de la suscripción
  └─ asigna fotografía limitada de forma atómica
```

### Servicios de servidor

1. `create-checkout`
   - Solo acepta un `product_id` válido y datos normalizados.
   - Lee precios y beneficios desde un catálogo de servidor versionado.
   - Busca la tarifa de despacho vigente; si no existe una regla aplicable, devuelve `shipping_quote_required` y no permite pagar.
   - Genera un UUID de pedido y una clave de idempotencia única.
   - Crea una Order de Mercado Pago con `external_reference` igual al identificador público del pedido.
   - Guarda el ID de proveedor antes de devolver `checkout_url`.

2. `mercadopago-webhook`
   - Acepta solamente los eventos configurados para la integración.
   - Verifica la firma `x-signature` con el secreto guardado solo en Netlify.
   - No confía en el cuerpo del webhook para declarar un pago aprobado.
   - Consulta `GET /v1/orders/{id}` con el Access Token del servidor.
   - Exige coincidencia de `external_reference`, Order ID, CLP, monto total y cuenta/entorno esperado.
   - Registra cada evento una sola vez y procesa reintentos de forma idempotente.
   - Devuelve `200` rápidamente después de persistir el evento; los efectos secundarios no críticos pueden ejecutarse después.

3. `order-status`
   - Devuelve solo un estado público reducido: `pending`, `paid`, `failed`, `refunded` o `cancelled`.
   - Requiere una referencia pública no secuencial y un token de consulta de corta duración o firmado.
   - Nunca devuelve dirección, teléfono ni payloads del proveedor.

4. `reconcile-payments`
   - Proceso programado diario para revisar pedidos pendientes y webhooks perdidos.
   - Consulta Mercado Pago y repara diferencias sin degradar estados terminales.
   - Genera alertas para pagos, reembolsos o contracargos que requieran revisión.

5. API administrativa
   - Lista y filtra pedidos, suscriptores y entregas.
   - Permite gestionar preparación, despacho, tracking y notas internas.
   - No permite marcar un pedido como pagado manualmente. El estado financiero solo puede venir de Mercado Pago o de una conciliación verificada.

## 4. Flujo de pago seguro

1. La persona elige Caja, Suscripción o Club.
2. Completa los datos mínimos necesarios y acepta los términos de compra. El newsletter sigue siendo opcional y separado.
3. El frontend envía el formulario a `create-checkout` por HTTPS.
4. El servidor vuelve a calcular todo. Ignora cualquier precio enviado por el navegador.
5. En una transacción se crea el cliente/pedido y se guarda la versión de términos aceptada.
6. El servidor crea una Order de Checkout Pro con `X-Idempotency-Key`.
7. La persona es redirigida al `checkout_url` de Mercado Pago. DDV nunca ve ni almacena los datos de tarjeta.
8. El retorno a `/revista/confirmacion/` muestra “estamos verificando” y consulta `order-status`.
9. Solo el webhook firmado, más la consulta server-to-server de la Order, puede mover el pedido a `paid`.
10. La confirmación crea las entregas pendientes y, cuando corresponda, asigna el beneficio limitado.

### Estados internos mínimos

```text
draft
checkout_created
payment_pending
paid
payment_failed
cancelled
refunded
partially_refunded
chargeback
```

El estado `processed/accredited` de la Order de Mercado Pago se mapea a `paid`. Estados como reembolso o contracargo nunca deben borrarse; deben conservar historial y cambiar el estado operativo de la orden.

## 5. Modelo de datos recomendado

### `customers`

- `id` UUID
- `email_normalized` único
- `full_name`
- `phone`
- `created_at`, `updated_at`

No guardar documentos de identidad si no son estrictamente necesarios. La dirección se mantiene separada para facilitar cambios y retención.

### `customer_addresses`

- `id`, `customer_id`
- región y comuna mediante códigos internos
- dirección, número, departamento, código postal e indicaciones
- `is_current`, timestamps

### `products`

- `id`, `sku`, nombre
- `price_clp`
- revistas/cajas incluidas
- `active`
- `catalog_version`

El servidor carga una versión controlada de estos registros. El navegador no puede cambiar precio, cantidad ni moneda.

### `orders`

- `id` UUID interno
- `public_reference` aleatoria y única
- `customer_id`
- `product_id` y snapshot de nombre/SKU/precio
- `status`
- `subtotal_clp`, `shipping_clp`, `total_clp`, `currency = CLP`
- `shipping_rate_id` y versión aplicada
- snapshot de dirección para el pedido
- versión de términos y `purchase_consent_at`
- `newsletter_opt_in` y `newsletter_consent_at`, independientes
- timestamps

### `payments`

- `id`, `order_id`
- `provider = mercadopago`
- `provider_order_id` único
- `provider_payment_id`, cuando exista
- `status`, `status_detail`
- monto y moneda confirmados
- modo prueba/producción
- timestamps de creación, aprobación, reembolso o contracargo

No guardar tarjetas, tokens de tarjeta ni credenciales. Evitar persistir payloads completos si contienen datos innecesarios; conservar solo campos auditables y una huella del evento.

### `payment_events`

- ID interno
- ID de evento/proveedor único
- `x_request_id` cuando corresponda
- tipo y acción
- hash del payload
- resultado de verificación
- fecha de recepción y procesamiento

La restricción única evita procesar dos veces un webhook reintentado.

### `subscriptions`

- `id`, `customer_id`, `order_id`
- plan contratado
- estado: `active`, `completed`, `cancelled`, `refunded`, `on_hold`
- fecha de inicio y término
- total de entregas previsto

### `edition_deliveries`

- `id`, `subscription_id`, `order_id`
- número de entrega `1..3`
- edición asociada, cuando exista
- incluye revista/caja
- estado: `pending`, `ready`, `shipped`, `delivered`, `returned`, `cancelled`
- dirección aplicada al momento de preparar la etiqueta
- transportista y tracking opcionales
- fechas de preparación, despacho y entrega

Para la Caja DDV N.º 01 se crea una entrega. Para Suscripción y Club se crean tres entregas pendientes al confirmar el pago. Si todavía no se conocen títulos o fechas de las ediciones 2 y 3, se usan ranuras `1`, `2`, `3`, no ediciones inventadas.

### `shipping_rates`

- `id`, `region_code`, `commune_code` opcional
- `amount_clp`
- `active_from`, `active_until`
- `active`, prioridad y versión

### `collectible_photo_allocations`

- `slot_number` entero, clave primaria, limitado a `1..200`
- `order_id` único
- fecha de asignación
- estado operativo

### `admin_audit_log`

- administrador
- acción
- entidad/ID
- valores anteriores y nuevos reducidos
- fecha, request ID

## 6. Control de las primeras 200 fotografías

La asignación ocurre **solo después de confirmar el pago en servidor**, nunca al abrir el checkout.

Dentro de la misma transacción que mueve el pedido a `paid`:

1. Bloquear el pedido para evitar procesamiento concurrente.
2. Comprobar que el producto es elegible y que el pedido aún no tiene asignación.
3. Tomar el primer `slot_number` libre entre 1 y 200.
4. Insertar la asignación con restricciones únicas en `slot_number` y `order_id`.
5. Confirmar la transacción junto con las entregas.

Aunque dos webhooks lleguen al mismo tiempo, PostgreSQL impedirá duplicar el slot o la asignación. Si ya no quedan slots, la compra puede continuar sin fotografía solamente si la comunicación comercial y los términos lo permiten.

Decisión aprobada: la fotografía se entrega exclusivamente a las primeras 200 Cajas DDV N.º 01 individuales pagadas. Club DDV y Suscripción DDV quedan excluidos. Sigue pendiente definir si un reembolso anterior al despacho libera el cupo; la Fase 1 no incorpora una operación de liberación.

## 7. Despacho configurable

No se incluirán valores ficticios. La tarifa se resuelve en servidor con este orden:

1. Regla exacta de comuna vigente.
2. Regla regional vigente.
3. Sin coincidencia: `shipping_quote_required`, sin crear el pago.

Cada pedido conserva un snapshot de la regla aplicada para que un cambio futuro de tarifas no modifique compras anteriores.

Para planes con tres entregas se necesita una decisión comercial antes de programar:

- **Opción recomendada:** cobrar por adelantado el despacho total de las tres entregas, calculado como tres envíos según la tabla vigente y mostrado antes de pagar.
- Alternativa: precio con despacho incluido.
- No recomendado: cobrar un despacho desconocido más adelante sin haberlo explicado y aceptado antes de la compra.

También debe definirse si una persona puede actualizar su dirección entre ediciones. Recomendación: permitirlo mediante atención/admin, mantener historial y congelar la dirección cuando cada entrega pase a `ready`.

## 8. Consentimientos

Los consentimientos se registran de forma independiente:

- **Compra:** obligatorio; versión de términos, fecha, pedido y evidencia técnica mínima.
- **Newsletter:** opcional, desmarcado por defecto y revocable; no condiciona la compra.

El alta de newsletter debe continuar usando su propio flujo y registro. Comprar no implica suscripción de marketing. Cancelar el newsletter no cancela una suscripción editorial pagada.

Antes de producción se debe aprobar una política de retención de datos, proceso de corrección/eliminación y responsables internos. Esto requiere revisión legal chilena específica; este documento no sustituye asesoría legal ni tributaria.

## 9. Panel administrativo mínimo

Ruta propuesta: `/admin/`.

Acceso:

- Registro público deshabilitado; usuarios solo por invitación.
- Netlify Identity con rol `admin` si la cuenta usa un plan compatible.
- Cada Netlify Function administrativa ejecuta su propia verificación de usuario y rol; ocultar la página no es autorización suficiente.
- 2FA obligatorio para las cuentas operadoras cuando el proveedor lo permita.

Vistas de primera versión:

1. **Resumen:** pedidos pendientes, pagados, por preparar, despachados y entregas próximas.
2. **Pedidos:** búsqueda por referencia/email, filtros por producto/estado/fecha y exportación CSV controlada.
3. **Detalle:** cliente, dirección, pago verificado, beneficio limitado, entregas, tracking y notas.
4. **Suscriptores:** plan, vigencia y progreso `0/3`, `1/3`, `2/3`, `3/3`.
5. **Entregas:** cola por edición, región y estado.
6. **Tarifas:** alta/desactivación de reglas regionales/comunales versionadas.

Cambios sensibles dejan registro en `admin_audit_log`. El panel no mostrará credenciales, secretos ni datos de tarjeta y no permitirá editar directamente el estado financiero.

## 10. Seguridad

- `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET` solo en variables de entorno de Netlify con alcance Functions; nunca en Git ni en HTML/JS.
- Separar credenciales de prueba y producción por contexto de deploy.
- Usar Checkout Pro alojado por Mercado Pago para que DDV no procese tarjetas.
- Validar esquema, longitud y formato de cada campo en servidor.
- Rate limiting en creación de checkout, consulta de estado y login administrativo.
- Comprobar `Origin`/CSRF en mutaciones administrativas y checkout.
- Usar SQL parametrizado y transacciones.
- Referencias públicas aleatorias; no exponer IDs secuenciales.
- Logs sin dirección, teléfono, Access Token ni payloads completos.
- Backups y prueba documentada de restauración antes de producción.
- Flujo de reembolso y contracargo probado antes de activar cobros.
- Alertas por fallos repetidos de webhook, diferencias de monto y pedidos pagados sin entregas.

## 11. Archivos involucrados en una futura implementación

### Archivos existentes a modificar

- `netlify.toml`: directorio/rutas de Functions, redirects de API y protección de admin.
- `editorial-products.js`: seguir mostrando productos, pero dejar de ser fuente de verdad financiera.
- `editorial-commerce.js`: enviar el formulario al backend y redirigir solo al `checkout_url` recibido.
- `revista/pedido/index.html`: validación, estados de envío y botón de Mercado Pago.
- `revista/confirmacion/index.html`: estado pendiente/verificado consultado al servidor.
- `politica-privacidad.html` y `terminos.html`: tratamiento de compra, despacho, pagos, reembolsos y entregas.
- `scripts/verify-public-output.mjs`: impedir secretos, precios no autorizados y confirmaciones de navegador.

### Archivos nuevos propuestos

```text
package.json
data/editorial-products.json
lib/server/catalog.mjs
lib/server/database.mjs
lib/server/mercadopago.mjs
lib/server/order-state.mjs
lib/server/shipping.mjs
lib/server/validation.mjs
netlify/functions/create-checkout.mjs
netlify/functions/mercadopago-webhook.mjs
netlify/functions/order-status.mjs
netlify/functions/reconcile-payments.mjs
netlify/functions/admin-orders.mjs
netlify/functions/admin-order-detail.mjs
netlify/functions/admin-fulfillment.mjs
netlify/functions/admin-shipping-rates.mjs
netlify/database/migrations/001_editorial_commerce.sql
admin/index.html
admin/admin.js
tests/payments/*.test.mjs
```

`data/editorial-products.json` permitiría generar o consumir una única definición de productos tanto en frontend como en Functions, evitando que los precios se mantengan manualmente en dos lugares.

Dependencias justificables para evaluar en implementación:

- SDK oficial `mercadopago`, especialmente para validación de firma.
- `@netlify/database` para Postgres integrado.
- `@netlify/identity` para el panel administrativo.

No se debe agregar un framework visual ni reemplazar los componentes DDV existentes.

## 12. Costos operativos estimados por verificar

### Mercado Pago

Mercado Pago Chile publica para cobros online una comisión sin costo fijo de:

- 3,19% + IVA con dinero disponible al instante.
- 2,89% + IVA con dinero disponible en 10 días.

Estas cifras deben confirmarse dentro de la cuenta comercial de **DDV SpA** antes de producción, porque pueden existir condiciones particulares, promociones, cuotas o cambios tarifarios.

Estimación simple con IVA de 19%, sin despacho, reembolsos, cuotas ni otros costos:

| Producto | Precio | Comisión estimada inmediata | Neto estimado | Comisión estimada a 10 días | Neto estimado |
| --- | ---: | ---: | ---: | ---: | ---: |
| Caja DDV N.º 01 | $15.990 | $607 | $15.383 | $550 | $15.440 |
| Suscripción DDV | $29.990 | $1.138 | $28.852 | $1.031 | $28.959 |
| Club DDV | $39.990 | $1.518 | $38.472 | $1.375 | $38.615 |

Los redondeos finales los determina Mercado Pago. Las cuotas sin interés pueden agregar costos y deben permanecer desactivadas hasta decidir una política comercial.

### Netlify

La cuenta actual puede estar en un plan legacy; debe revisarse en `Usage & billing` antes de escoger base de datos.

Precios públicos credit-based observados para presupuestar, sujetos a confirmación:

- Free: USD 0, con 300 créditos mensuales.
- Personal: USD 9/mes, con 1.000 créditos.
- Pro: desde USD 20/mes, con 3.000 créditos.
- Producción: 15 créditos por deploy.
- Compute: 10 créditos por GB-hora.
- Tráfico: 20 créditos por GB.
- Requests: 2 créditos por 10.000 solicitudes.

Netlify Database solo está disponible en planes credit-based y consume compute/bandwidth. No se puede estimar el costo mensual real sin conocer plan actual, tráfico, cantidad de webhooks y comportamiento de la base.

### Alternativa Supabase

- Free: USD 0 para desarrollo, pero puede pausarse tras inactividad y no tiene backups automáticos.
- Pro: desde USD 25/mes; incluye un proyecto Micro cubierto por créditos de compute, backups diarios y mayores cuotas.

Para producción con datos de clientes, la opción gratuita no es la recomendación operativa. Si Netlify Database no es viable, presupuestar Supabase Pro y confirmar región, retención y términos de tratamiento de datos.

### Otros costos que DDV debe cotizar

- Transportista y materiales de embalaje por cada una de las tres entregas.
- Correos transaccionales, si se supera el servicio incluido del proveedor elegido.
- Emisión de boleta/factura electrónica y conciliación contable.
- Atención de devoluciones, pedidos extraviados y reenvíos.
- Dominio propio y correo corporativo, si todavía no están contratados.
- Asesoría legal/privacidad y revisión tributaria previa al lanzamiento.

## 13. Riesgos principales y mitigaciones

| Riesgo | Mitigación propuesta |
| --- | --- |
| El navegador altera precio o producto | Recalcular siempre en servidor con catálogo versionado |
| Retorno falso de “pago exitoso” | El retorno nunca confirma; solo webhook firmado + consulta a Mercado Pago |
| Webhook duplicado o fuera de orden | Idempotencia, tabla de eventos, bloqueo de fila y máquina de estados |
| Dos pedidos reciben la misma fotografía | Transacción PostgreSQL y restricciones únicas de slot/pedido |
| Se agotan las 200 fotografías entre dos pagos | Asignación atómica al confirmar `paid`; mensaje comercial condicionado a disponibilidad real |
| No existe tarifa para una comuna | Bloquear checkout y derivar a cotización, nunca asumir $0 |
| Tres entregas cuestan más que lo cobrado | Definir despacho anual antes de activar pagos |
| Acceso indebido al panel | Invitación, rol admin, autorización server-side, 2FA y auditoría |
| Filtración de datos personales en logs | Minimización, redacción de logs y política de retención |
| Webhook perdido | Conciliación programada y alertas |
| Reembolso/contracargo con entregas pendientes | Suspender entregas futuras y abrir revisión administrativa |
| Cambio de precio después de iniciar checkout | Snapshot de pedido; Order expirable; catálogo con versión |
| Dependencia de un proveedor | Capa `payment_provider` y estados internos independientes de Mercado Pago |

## 14. Fases de implementación propuestas

### Fase 0 — decisiones y cuentas

- Resolver las decisiones del apartado 16.
- Confirmar cuenta Mercado Pago de DDV SpA, tarifas y credenciales de prueba.
- Confirmar plan Netlify y proveedor de PostgreSQL.
- Aprobar términos, privacidad, despacho, reembolsos y tratamiento tributario.

### Fase 1 — base segura sin cobros

- Agregar entorno local, Functions, migraciones y catálogo de servidor.
- Crear esquema, datos de prueba y panel administrativo con acceso por invitación.
- Mantener el botón público deshabilitado.
- Probar creación de pedidos con datos ficticios únicamente.

### Fase 2 — Mercado Pago en pruebas

- Integrar Orders API con credenciales sandbox.
- Implementar firma de webhook, consulta server-to-server e idempotencia.
- Probar aprobado, pendiente, rechazado, expirado, reembolso, webhook duplicado y orden fuera de secuencia.
- Probar concurrencia para la fotografía 199, 200 y 201.

### Fase 3 — operaciones y QA

- Configurar tarifas reales y entregas.
- Validar panel, exportación, tracking, conciliación y auditoría.
- Ejecutar pruebas responsive y accesibilidad sin cambiar la identidad DDV.
- Revisión legal, contable y operativa.

### Fase 4 — activación controlada

- Deploy de producción todavía con feature flag apagado.
- Hacer una compra interna controlada con monto/producto autorizado.
- Verificar pago, webhook, pedido, fotografía, entrega y comprobante.
- Activar ventas solo con aprobación escrita de DDV.

## 15. Pruebas y puertas de salida

No activar producción hasta que todas pasen:

- El cliente no puede enviar precio, moneda ni costo de despacho efectivo.
- Cada creación de Order usa una idempotency key.
- Firmas inválidas reciben `401` y no cambian datos.
- Un retorno `success` sin webhook no crea una venta.
- El webhook vuelve a consultar la Order en Mercado Pago.
- Monto, CLP y referencia coinciden antes de `paid`.
- Diez webhooks iguales producen una sola transición y una sola asignación.
- Dos pagos simultáneos no comparten slot de fotografía.
- El pedido 201 no recibe fotografía.
- Suscripción y Club crean exactamente tres entregas.
- Compra y newsletter guardan consentimientos separados.
- Falta de tarifa bloquea el checkout.
- Usuario sin rol admin no puede consultar ni modificar pedidos.
- Ningún secreto aparece en HTML, JS, repositorio, logs o respuestas.
- Reembolso/contracargo suspende entregas futuras y queda auditado.
- El catálogo de insumos conserva su comportamiento actual.

## 16. Decisiones que DDV debe tomar antes de programar

1. **Acreditación Mercado Pago:** ¿al instante o en 10 días?
2. **Despacho anual:** ¿se cobra por las tres entregas al inicio o queda incluido en el precio?
3. **Tarifas reales:** tabla por región, por comuna o cotización del transportista mediante API.
4. **Club y fotografía:** resuelto; Club no consume cupos y no recibe la fotografía limitada.
5. **Reembolsos:** ¿un cupo no despachado se libera o nunca se reutiliza?
6. **Dirección anual:** resuelto; se puede actualizar antes de preparar cada edición, conservando historial.
7. **Beneficios Club:** definirlos antes de permitir comprar el plan.
8. **Base de datos:** resuelto; Netlify Database en plan Personal credit-based.
9. **Administradores:** nombres/correos que recibirán invitación y roles necesarios.
10. **Documentos tributarios:** proveedor y momento de emisión de boleta/factura.
11. **Política de cambios y devoluciones:** plazos, costos de reenvío y responsable operativo.
12. **Dominio de producción:** confirmar si se seguirá usando `netlify.app` o un dominio propio antes de registrar URLs y webhooks definitivos.

## 17. Recomendación de aprobación

Aprobar primero **Fases 0 y 1**, manteniendo cobros desactivados. La programación de Mercado Pago debe comenzar solo después de resolver despacho, elegibilidad de la fotografía, proveedor de base de datos y beneficios finales del Club.

## 18. Fuentes oficiales consultadas

- [Mercado Pago — Checkout Pro vía Orders API](https://www.mercadopago.cl/developers/es/docs/checkout-pro-orders/create-order)
- [Mercado Pago — referencia de creación de Order](https://www.mercadopago.cl/developers/es/reference/online-payments/checkout-pro/create-order/post)
- [Mercado Pago — webhooks y validación de firma](https://www.mercadopago.cl/developers/es/docs/checkout-pro-orders/resources/notifications/webhooks)
- [Mercado Pago — checklist para producción](https://www.mercadopago.cl/developers/es/docs/checkout-pro-orders/go-to-production)
- [Mercado Pago Chile — costos de cobro online](https://www.mercadopago.cl/herramientas-para-vender/link-de-pago)
- [Netlify — Functions](https://docs.netlify.com/build/functions/get-started/)
- [Netlify — variables de entorno](https://docs.netlify.com/build/environment-variables/overview/)
- [Netlify — Database](https://docs.netlify.com/build/data-and-storage/netlify-database/)
- [Netlify — API y transacciones de Database](https://docs.netlify.com/build/data-and-storage/netlify-database/api/)
- [Netlify — acceso por roles](https://docs.netlify.com/manage/security/secure-access-to-sites/role-based-access-control/)
- [Netlify — precios](https://www.netlify.com/pricing/)
- [Supabase — precios](https://supabase.com/pricing)
- [Supabase — facturación y cuotas](https://supabase.com/docs/guides/platform/billing-on-supabase)
