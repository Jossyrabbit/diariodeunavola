# DDV — activación pendiente de Netlify Database e Identity

Estado: código local preparado; **ningún recurso remoto activado y ningún deploy realizado**.

## Qué ya está preparado localmente

- Migración PostgreSQL versionada en `netlify/database/migrations/`.
- Productos y precios validados en servidor, todos con `active = false`.
- Panel `/admin/` y acceso `/admin/login/`.
- Netlify Functions administrativas protegidas con `getUser()` y rol `admin`.
- Registro público ausente del código y checkout público deshabilitado.
- Pruebas con PostgreSQL emulado y datos `example.test`.

## Consumo que debe aprobarse antes de activar Database

Netlify Database en el plan Personal usa los créditos compartidos de la cuenta:

- cómputo de Database: 10 créditos por unidad-hora activa;
- salida de Database: 20 créditos por GB;
- cada deploy de producción: 15 créditos;
- el plan informado por DDV incluye 1.000 créditos mensuales.

La base puede dormir después de 5 minutos sin actividad. El consumo real no puede fijarse antes de observar el tráfico y el tiempo activo. Como referencia oficial, Netlify muestra un ejemplo de 37 horas activas a una unidad mínima equivalente a 370 créditos. Esto no es una proyección para DDV.

Activar la base puede comenzar a consumir créditos. Por esa razón este repositorio no ejecuta `netlify database init`, no aprovisiona recursos y no despliega la migración automáticamente desde esta tarea.

## Pasos que debe realizar el propietario en Netlify, después de aprobar el consumo

### 1. Database

1. Abrir el proyecto `diariodeunavola`.
2. Ir a **Data & Storage → Database**.
3. Revisar nuevamente el resumen de consumo del plan Personal.
4. Seleccionar la región recomendada por Netlify para las Functions del sitio.
5. Crear la base solamente después de aprobar expresamente el consumo.
6. No crear tablas manualmente: la migración versionada se aplicará en el primer deploy autorizado.

### 2. Identity

1. Ir a **Identity → Registration**.
2. Mantener el registro en modo **Invite only** o equivalente; no habilitar registro público.
3. No habilitar proveedores externos todavía.
4. En **Users**, usar **Invite users** únicamente para el correo administrativo autorizado por DDV.
5. Cuando la invitación haya sido aceptada, abrir el usuario y asignar exactamente el rol `admin` en `app_metadata.roles` mediante la interfaz de Netlify.
6. Cerrar y volver a iniciar sesión después de cambiar el rol, porque los roles se actualizan al renovar el JWT.
7. No compartir contraseñas, tokens ni capturas que incluyan secretos.

No se invitó a ninguna persona desde esta tarea porque falta el correo y la autorización explícita.

### 3. Primer deploy controlado

Cuando DDV apruebe desplegar:

1. Revisar el diff y hacer commit.
2. Confirmar que Database e Identity pertenecen al mismo proyecto Netlify.
3. Desplegar primero con los productos todavía inactivos.
4. Verificar que la migración figure como aplicada.
5. Confirmar que una visita sin sesión a `/admin/` recibe la pantalla de acceso.
6. Confirmar que una cuenta sin rol `admin` recibe `403` en las APIs.
7. Confirmar que la cuenta invitada con rol `admin` puede ver tablas vacías.
8. Revisar consumo de créditos después de la prueba.

## Funcionalidades deliberadamente ausentes

- No existe Function pública para crear pedidos.
- No existe integración ni secreto de Mercado Pago.
- No existe tarifa de despacho.
- No existe registro público de Identity.
- No existen usuarios administradores creados por código.
- No existe mecanismo para marcar manualmente pedidos reales como pagados.
- No se definieron beneficios adicionales de Club DDV.

## Variables y credenciales

Esta fase no requiere agregar credenciales al repositorio. Netlify Database entrega su conexión al runtime; Identity valida la cookie firmada `nf_jwt`. Ningún token debe agregarse a HTML, JavaScript público, Git o archivos `.env` versionados.
