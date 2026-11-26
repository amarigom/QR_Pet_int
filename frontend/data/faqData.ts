export type FaqAudience = "owners" | "vets";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: "cuenta" | "qr" | "estudios" | "gestion";
}

export interface FaqSectionGroup {
  audience: FaqAudience;
  title: string;
  subtitle: string;
  items: FaqItem[];
}

export const FAQ_DATA: Record<FaqAudience, FaqSectionGroup> = {
  owners: {
    audience: "owners",
    title: "Preguntas Frecuentes para Dueños",
    subtitle: "Todo sobre tu cuenta, las medallas PetQR y los estudios clínicos de tu mascota.",
    items: [
      {
        id: "owner-register",
        category: "cuenta",
        question: "¿Cómo creo mi cuenta de dueño?",
        answer:
          'Desde la página principal tocá "Registrarse" (o "Crear Cuenta Gratis"), completá tus datos y creá tu contraseña. Después iniciás sesión con "Iniciar sesión".',
      },
      {
        id: "owner-vet-activation",
        category: "cuenta",
        question: "Mi veterinaria me creó una cuenta, ¿cómo la uso?",
        answer:
          'Si tu veterinaria te registró como cliente, recibís por WhatsApp un enlace único de activación. Abrilo, elegí tu contraseña privada y tu cuenta queda activa. Si el enlace venció o no te llegó, pedile a la veterinaria que use "Reenviar activación".',
      },
      {
        id: "owner-dashboard",
        category: "cuenta",
        question: "¿Qué veo cuando inicio sesión como dueño?",
        answer:
          'Un panel con el menú "Inicio", "Mis Mascotas" y "Mapa de Escaneos". Desde ahí administrás tus mascotas, revisás sus estudios clínicos y ves dónde se escaneó la medalla.',
      },
      {
        id: "owner-qr-types",
        category: "qr",
        question: "¿Cuál es la diferencia entre el QR físico de la chapita y el código clínico (CLN-XXXXXX)?",
        answer:
          "El QR físico es el que viene grabado en la medalla del collar y sirve para identificar a tu mascota si se pierde (muestra tus datos de contacto y registra ubicación de escaneo). El código clínico (con formato CLN-XXXXXX) es un identificador médico interno que permite que veterinarias o centros de diagnóstico ubiquen su ficha para cargarle estudios incluso si todavía no tiene una chapita física asociada.",
      },
      {
        id: "owner-lost-pet",
        category: "qr",
        question: "Perdí a mi mascota, ¿qué hago?",
        answer:
          "Mantené los datos de contacto actualizados en la ficha, revisá el mapa de escaneos y tu WhatsApp por mensajes de quien la encuentre. Si perdiste la medalla, reemplazala por otra desde la ficha.",
      },
      {
        id: "owner-clinical-history",
        category: "estudios",
        question: "¿Puedo ver la historia clínica de mi mascota?",
        answer:
          "Las consultas evolutivas las registra cada veterinaria y puede mostrártelas en el consultorio. En cambio, todos los análisis clínicos y estudios por imágenes que te carguen quedan disponibles directamente en tu cuenta para que los veas y descargues cuando quieras.",
      },
      {
        id: "owner-where-studies",
        category: "estudios",
        question: "¿Dónde veo los análisis clínicos que le hicieron a mi mascota?",
        answer:
          'Iniciá sesión en PetQR, entrá a "Mis Mascotas", abrí la ficha de tu mascota y deslizá hasta la sección "Estudios Clínicos". Ahí vas a encontrar todos los análisis de laboratorio, radiografías o ecografías subidos tanto por tu veterinaria de cabecera como por centros de diagnóstico externos.',
      },
      {
        id: "owner-portable-studies",
        category: "estudios",
        question: "¿Tengo que llevar los estudios impresos si voy a una guardia o a otra veterinaria?",
        answer:
          "No hace falta. Todo queda guardado en el perfil digital de tu mascota; podés descargar el PDF o la imagen desde tu celular en el momento, o tu veterinario de cabecera puede consultarlos desde su panel.",
      },
      {
        id: "owner-readonly-studies",
        category: "estudios",
        question: "¿Puedo borrar o editar un análisis clínico desde mi cuenta?",
        answer:
          "No. Como dueño tenés acceso completo para ver y descargar los informes cuando los necesites, pero solo los profesionales veterinarios habilitados pueden cargar estudios para mantener el respaldo médico original.",
      },
    ],
  },
  vets: {
    audience: "vets",
    title: "Preguntas Frecuentes para Veterinarias y Centros de Diagnóstico",
    subtitle: "Gestión de pacientes, identificadores clínicos y carga segura de estudios.",
    items: [
      {
        id: "vet-login",
        category: "cuenta",
        question: "¿Cómo entro como veterinaria?",
        answer:
          'Iniciá sesión con la cuenta de veterinaria que te dio PetQR. El perfil veterinario no se elige al registrarse desde la página pública: si querés sumar tu clínica o centro de diagnóstico, usá "Quiero sumar mi veterinaria" de la landing o contactanos por WhatsApp.',
      },
      {
        id: "vet-sections",
        category: "gestion",
        question: "¿Qué secciones tiene el panel veterinario?",
        answer:
          'Cuenta con las secciones de "Clientes", "Mascotas y QR", "Escaneos", "Turnos", "Historias clínicas" y "Conocimiento IA", además del bloque superior de "Identidad de la veterinaria".',
      },
      {
        id: "vet-logo",
        category: "gestion",
        question: "¿Cómo cargo el logo de mi veterinaria?",
        answer:
          'En "Identidad de la veterinaria" subí un logo PNG, JPG o WebP de hasta 2 MB. Se usa como marca de tu clínica en la plataforma.',
      },
      {
        id: "vet-resend-activation",
        category: "cuenta",
        question: "Mi cliente no activó la cuenta. ¿Qué hago?",
        answer:
          'En la tabla "Clientes vinculados" aparece como "Pendiente de activar". Tocá "Reenviar activación".',
      },
      {
        id: "vet-client-list",
        category: "gestion",
        question: "¿Qué clientes aparecen en mi lista?",
        answer:
          "Los que registraste vos o los que ya tienen un turno o una consulta clínica con tu clínica.",
      },
      {
        id: "vet-pet-list",
        category: "gestion",
        question: "¿Cómo aparece una mascota en mi lista?",
        answer:
          "Cuando el dueño la vincula con tu clínica, o cuando existe un turno o una historia clínica tuya sobre ella. Registrar al cliente solo no hace que sus mascotas aparezcan.",
      },
      {
        id: "vet-link-owner",
        category: "gestion",
        question: "¿Cómo hago para que el dueño me vincule?",
        answer:
          "Pedile que, en la ficha de su mascota, busque tu clínica y la vincule. Es la forma más clara para un primer turno.",
      },
      {
        id: "vet-qr-vs-cln",
        category: "qr",
        question: "¿Qué diferencia hay entre el QR físico de la chapita y el QR clínico (CLN-XXXXXX)?",
        answer:
          "El QR físico corresponde a la medalla de identificación urbana que lleva la mascota en su collar (orientado a extravíos y contacto con el tutor). El QR clínico (CLN-XXXXXX) es un identificador generado dentro del flujo médico para operar sobre la ficha clínica y cargar estudios incluso si la mascota no tiene chapita física o todavía no la vinculó.",
      },
      {
        id: "vet-search-qr",
        category: "qr",
        question: "¿Cómo busco el QR o identificador de un paciente?",
        answer:
          'En la sección "Mascotas y QR" (o desde el buscador clínico) podés localizar a la mascota por su código PetQR, su identificador clínico (CLN-XXXXXX) o escaneando directamente su medalla física.',
      },
      {
        id: "vet-external-study-upload",
        category: "estudios",
        question: "¿Puedo subir un análisis clínico si la mascota no es paciente habitual de mi clínica?",
        answer:
          "Sí. Si trabajás como centro de diagnóstico externo, laboratorio o atendés una derivación puntual, podés buscar la mascota por su código QR o identificador clínico (CLN-XXXXXX) y subir el estudio directamente a su ficha, sin que el dueño tenga que vincularte previamente como veterinaria de cabecera.",
      },
      {
        id: "vet-external-study-privacy",
        category: "estudios",
        question: "Si subo un estudio a una mascota que no es de mi clínica, ¿veo sus estudios anteriores?",
        answer:
          "No, por privacidad clínica. Si la mascota no está vinculada a tu clínica como paciente de cabecera, podés cargar el nuevo estudio y ver únicamente los informes que vos mismo subiste para esa mascota. En cambio, su veterinario de cabecera sí visualiza el historial completo de estudios.",
      },
      {
        id: "vet-study-formats-security",
        category: "estudios",
        question: "¿Qué formatos admite la carga de análisis clínicos y cómo se protegen los archivos?",
        answer:
          "Podés subir informes en PDF e imágenes (JPG, PNG, WEBP) indicando título, categoría (laboratorio, radiografía, ecografía, cardiología, etc.), fecha del estudio, profesional solicitante y notas. Los archivos se guardan en almacenamiento privado y se abren mediante enlaces temporales firmados de 15 minutos.",
      },
    ],
  },
};