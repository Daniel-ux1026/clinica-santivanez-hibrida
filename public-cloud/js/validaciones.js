(function () {
  "use strict";
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const PHONE_RE = /^\+?[0-9][0-9\s-]{6,17}$/;
  const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.'-]{2,80}$/;
  const SAFE_TEXT_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,()'/-]{2,160}$/;
  const MEDICAL_TOKENS = ["historia", "diagnostico", "tratamiento", "receta", "resultado", "antecedente", "observacion", "documentoclinico"];
  const REQUEST_KEYS = ["uuid", "nombre", "correo", "telefono", "especialidad", "medico", "fecha", "hora", "motivo", "estado", "consentimiento", "fechaRegistro"];
  const RESPONSE_KEYS = ["uuid", "estado", "fecha", "hora", "fechaActualizacion"];
  const REQUEST_STATES = ["Pendiente", "Cancelada"];
  const RESPONSE_STATES = ["Pendiente", "Confirmada", "Rechazada", "Reprogramada", "Cancelada"];

  function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
    const [year, month, day] = value.split("-").map(Number), date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }
  function isFutureDate(value) {
    if (!isValidDate(value)) return false;
    const date = new Date(value + "T12:00:00");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return !Number.isNaN(date.getTime()) && date > today;
  }
  function hasExactKeys(obj, allowed) {
    const keys = Object.keys(obj || {});
    return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
  }
  function normalizeKey(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f_-]/g, "").toLowerCase(); }
  function containsSensitiveKey(value) {
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some((key) => MEDICAL_TOKENS.some((token) => normalizeKey(key).includes(token))) || Object.values(value).some((child) => child && typeof child === "object" && containsSensitiveKey(child));
  }
  function validateRequest(item, strictKeys) {
    const errors = [];
    if (!item || typeof item !== "object" || Array.isArray(item)) return ["La reserva debe ser un objeto JSON."];
    if (containsSensitiveKey(item)) errors.push("El archivo contiene campos médicos sensibles no permitidos.");
    if (strictKeys && !hasExactKeys(item, REQUEST_KEYS)) errors.push("La reserva contiene campos faltantes o inesperados.");
    if (!UUID_RE.test(String(item.uuid || ""))) errors.push("UUID de reserva inválido.");
    if (!NAME_RE.test(String(item.nombre || ""))) errors.push("Nombre inválido.");
    if (!EMAIL_RE.test(String(item.correo || "")) || String(item.correo || "").length > 100) errors.push("Correo inválido.");
    if (!PHONE_RE.test(String(item.telefono || ""))) errors.push("Teléfono inválido.");
    if (!window.SantivanezPublicData.specialties.some((row) => row.id === item.especialidad)) errors.push("Especialidad inválida.");
    if (!window.SantivanezPublicData.doctors.some((row) => row.id === item.medico && row.specialty === item.especialidad)) errors.push("Médico inválido para la especialidad.");
    if (!isValidDate(item.fecha)) errors.push("Fecha inválida.");
    if (!/^\d{2}:\d{2}$/.test(String(item.hora || ""))) errors.push("Hora inválida.");
    if (!SAFE_TEXT_RE.test(String(item.motivo || ""))) errors.push("Motivo general inválido.");
    if (!REQUEST_STATES.includes(item.estado)) errors.push("Estado inicial inválido.");
    if (typeof item.consentimiento !== "boolean" || item.consentimiento !== true) errors.push("El consentimiento es obligatorio.");
    if (Number.isNaN(Date.parse(item.fechaRegistro))) errors.push("Fecha de registro inválida.");
    return errors;
  }
  function validateResponse(item) {
    const errors = [];
    if (!item || typeof item !== "object" || Array.isArray(item)) return ["La respuesta debe ser un objeto JSON."];
    if (containsSensitiveKey(item)) errors.push("El archivo contiene campos médicos sensibles no permitidos.");
    if (!hasExactKeys(item, RESPONSE_KEYS)) errors.push("La respuesta contiene campos faltantes o inesperados.");
    if (!UUID_RE.test(String(item.uuid || ""))) errors.push("UUID inválido.");
    if (!RESPONSE_STATES.includes(item.estado)) errors.push("Estado inválido.");
    if (!isValidDate(item.fecha)) errors.push("Fecha confirmada inválida.");
    if (!/^\d{2}:\d{2}$/.test(String(item.hora || ""))) errors.push("Hora confirmada inválida.");
    if (Number.isNaN(Date.parse(item.fechaActualizacion))) errors.push("Fecha de actualización inválida.");
    return errors;
  }
  window.PublicValidation = { UUID_RE, EMAIL_RE, PHONE_RE, NAME_RE, SAFE_TEXT_RE, isValidDate, isFutureDate, validateRequest, validateResponse, containsSensitiveKey };
})();
