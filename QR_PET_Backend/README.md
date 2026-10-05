# QR Pet Backend

## Listados de códigos QR

La lista administrativa `GET /api/v1/qr` admite `page`, `limit`, `search` y `assignment`.
La búsqueda contempla código, lote, nombre de mascota, nombre y correo del dueño; `assignment`
puede ser `all`, `assigned` o `available`. El panel consume el total y permite cambiar de página.
El listado de mascotas del usuario `GET /api/v1/pets` también admite `search`, además de `page`
y `limit`, buscando por nombre, especie, raza o código QR.

## Turnos y recordatorios por WhatsApp

Los turnos se muestran en una agenda semanal. El endpoint `GET /api/v1/turnos/agenda/semanal`
recibe `inicio` y `fin` como datetimes ISO 8601 con zona horaria (intervalo de siete días).
Eliminar un turno lo marca como `CANCELADO`; el registro se conserva y deja de aparecer en la
agenda.

Para activar recordatorios automáticos:

1. Aplicá las migraciones con `alembic upgrade head`. Los clientes existentes quedan con el
   consentimiento de WhatsApp desactivado.
2. Configurá `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` de WhatsApp Cloud API.
   Opcionalmente, configurá `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE`,
   `WHATSAPP_API_VERSION` y `REMINDER_TIMEZONE`.
3. Creá y aprobá en Meta una plantilla de mensaje con cinco variables de texto en el cuerpo,
   en este orden: nombre del cliente, nombre de la mascota, fecha, hora y tipo de servicio.
4. El cliente debe cargar su teléfono internacional y aceptar el consentimiento en “Modificar
   contacto” en el dashboard. El permiso puede revocarse desde allí.
5. Reiniciá el backend. El scheduler consulta cada cinco minutos y envía la plantilla en la
   ventana de las 24 horas previas al turno, con diez minutos de margen para absorber demoras
   del proceso. Solo procesa turnos programados; al confirmar el envío, los marca para no
   repetirlo.

Sin las dos variables obligatorias de WhatsApp, el scheduler informa que queda desactivado y
no intenta enviar mensajes. Los fallos de envío quedan registrados y el turno no se marca como
notificado, de modo que pueda reintentarse en la siguiente ejecución.

## Alta de clientes por veterinarios

El veterinario puede crear una cuenta cliente desde la pestaña **Clientes**. La cuenta queda
vinculada a su perfil aunque todavía no tenga mascotas. Se genera un token de activación único
con vencimiento a las 48 horas y se envía una plantilla de WhatsApp llamada
`WHATSAPP_ACTIVATION_TEMPLATE_NAME` (por defecto `activacion_cuenta`), con dos variables en el
cuerpo: nombre del cliente y enlace de activación. El cliente define su contraseña privada en
el enlace; no se envía ni se comparte una contraseña temporal.

Si WhatsApp no está configurado o Meta rechaza el envío, la cuenta sigue creada y el veterinario
recibe el enlace de activación para compartirlo manualmente. El enlace solo se guarda en forma
de hash en la base de datos. Se pueden configurar `WHATSAPP_ACTIVATION_TEMPLATE_NAME` y
`WHATSAPP_TEMPLATE_LANGUAGE` junto con las credenciales de WhatsApp Cloud API.

El veterinario puede cargar un logo PNG/JPG/WebP de hasta 2 MB desde su panel. Se normaliza a
WebP y se muestra a todos los clientes asociados a la veterinaria en su dashboard. Clientes
asociados a varias veterinarias verán todas sus marcas. Las vinculaciones existentes por turnos
e historias clínicas se migran automáticamente.

Los clientes pendientes de activación pueden recibir un nuevo enlace desde la lista de clientes.
Si Meta rechaza el envío de WhatsApp, el panel muestra el motivo devuelto por la API y permite
copiar el enlace para enviarlo manualmente. Las páginas bajo `/auth` no llevan prefijo de idioma;
el enlace directo a `/auth/activate` funciona con el middleware de `next-intl`.

## Asistente y conocimiento vectorizado

Aplicá `alembic upgrade head` para agregar alcance a `knowledge_vectors` y el indicador
`historias_clinicas.vectorizada`. Las filas de conocimiento existentes se consideran documentos
globales del administrador.

En **Dashboard Admin → Conocimiento IA**, administración puede cargar PDF, Word `.docx` o TXT
(máximo 10 MB; texto extraído hasta 300.000 caracteres). Los archivos se dividen en fragmentos,
se vectorizan con Gemini y quedan disponibles para usuarios y veterinarios. En la pestaña
**Conocimiento IA** del panel veterinario, el profesional puede cargar su propia documentación y
vectorizar historias clínicas pendientes.

El asistente aparece en los paneles de usuario y veterinario. Las respuestas de usuario consultan el conocimiento global del administrador y los documentos
generales de las veterinarias vinculadas a sus mascotas; nunca recuperan historias clínicas. Las
respuestas veterinarias combinan ese contenido compartido con documentos del veterinario
autenticado, mascotas de sus clientes vinculados e historias clínicas creadas por ese veterinario;
el backend filtra esos alcances antes de recuperar contexto. Las nuevas historias se vectorizan al
registrarse. `POST
/api/v1/historias-clinicas/vectorizar` permite reintentar historias propias que quedaron pendientes,
con un máximo de 200 por llamada.

Las rutas de carga, listado y consulta de conocimiento requieren autenticación. Solo administración
y veterinarios pueden cargar documentos; el alcance se determina por el rol y el usuario autenticado,
nunca por un identificador de propietario enviado por el cliente.
