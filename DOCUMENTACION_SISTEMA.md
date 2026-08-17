# DOCUMENTACIÓN DEL SISTEMA — SISTEMA DE TICKETS DE SOPORTE IT

## 1. Resumen y Control de Versiones

| Versión | Fecha | Descripción de Cambios |
| :--- | :---: | :--- |
| **v1.0.0** | 2026-08-17 | Creación inicial de la arquitectura, modelos de datos M1-M6, diseño UI y migración a Supabase. |
| **v1.0.1** | 2026-08-17 | **Corrección de la función de Registro (`signUp`)**: Se garantizó la exportación global en `window` y se agregaron envoltorios de ejecución segura (`executeSignUp`, `executeSignIn`, `executeSignOut`) en `app.js` con resolución directa contra el cliente de Supabase SDK v2, conectando el evento submit del formulario de registro y previniendo errores de referencia no definida. |

---

## 2. Especificación de Autenticación y Registro (Módulo M2)

### Flujo de Registro (`executeSignUp`)
1. **Captura del Formulario**:
   - El usuario ingresa correo y contraseña en el formulario `#form-register`.
   - Se valida en el cliente que las contraseñas coincidan y que cumplan la longitud mínima de 6 caracteres.
2. **Llamada a Supabase Auth**:
   - Se invoca la función de registro:
     ```javascript
     supabase.auth.signUp({ email, password })
     ```
   - Las credenciales son enviadas a GoTrue (Supabase Auth).
3. **Trigger de Base de Datos (`handle_new_user`)**:
   - PostgreSQL crea automáticamente el perfil en la tabla `perfiles`.
   - El primer usuario registrado adquiere rol `'admin'`, mientras que los siguientes reciben `'usuario'`.
4. **Respuesta UI**:
   - Si la sesión se crea inmediatamente (sin confirmación obligatoria por correo), el frontend autentica al usuario y carga el dashboard principal.
   - Si requiere confirmación, se muestra mensaje de confirmación y se retorna al formulario de inicio de sesión.

---

## 3. Arquitectura del Sistema y Módulos

- **M1 — Núcleo de Tickets**: CRUD de incidencias, trazabilidad por folio, asignación de estados (`nuevo`, `asignado`, `en_progreso`, `en_espera`, `resuelto`, `cerrado`).
- **M2 — Autenticación y RBAC**: Control de acceso por roles (`admin`, `agente`, `usuario`) con Row Level Security (RLS) en Supabase.
- **M3 — SLA y Tiempos de Respuesta**: Monitoreo de plazos según prioridad (`baja`, `media`, `alta`, `critica`).
- **M4 — Notificaciones**: Toasts in-app y registro de auditoría.
- **M5 — Base de Conocimiento**: Categorías, subcategorías y catálogo de diagnósticos/soluciones.
- **M6 — Dashboard y Reportes**: Métricas semanales y exportación en formato PDF (`jsPDF`) y CSV.

---

## 4. Estado de la Base de Datos

- **Archivo DDL**: [`schema.sql`](file:///c:/Users/Gerardo/OneDrive/Desktop/sistema-soporte/schema.sql)
- **Tablas Principales**: `perfiles`, `areas`, `usuarios`, `tickets`, `categorias`, `subcategorias`, `ticket_historial`, `ticket_comentarios`.
- **Seguridad**: RLS habilitado con políticas de lectura y escritura controladas.
