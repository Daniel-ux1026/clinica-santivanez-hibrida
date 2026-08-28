(function () {
  "use strict";
  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    const bytes = new Uint8Array(16); window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    return [...bytes].map((byte, index) => ([4, 6, 8, 10].includes(index) ? "-" : "") + byte.toString(16).padStart(2, "0")).join("");
  }
  function doctor(id) { return window.SantivanezPublicData.doctors.find((row) => row.id === id); }
  function specialty(id) { return window.SantivanezPublicData.specialties.find((row) => row.id === id); }
  function isSlotValid(doctorId, dateValue, hour) {
    const row = doctor(doctorId);
    if (!row || !window.PublicValidation.isFutureDate(dateValue) || !row.hours.includes(hour)) return false;
    const weekday = new Intl.DateTimeFormat("es-PE", { weekday: "long", timeZone: "UTC" }).format(new Date(dateValue + "T12:00:00Z"));
    const normalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return row.days.includes(normalized);
  }
  function isDuplicate(candidate) {
    return window.PublicStorage.list().some((row) => row.estado !== "Cancelada" && row.correo.toLowerCase() === candidate.correo.toLowerCase() && row.medico === candidate.medico && row.fecha === candidate.fecha && row.hora === candidate.hora);
  }
  function isOccupied(candidate) {
    return window.PublicStorage.list().some((row) => row.estado !== "Cancelada" && row.medico === candidate.medico && row.fecha === candidate.fecha && row.hora === candidate.hora);
  }
  function create(values) {
    const item = {
      uuid: uuid(), nombre: values.nombre.trim(), correo: values.correo.trim().toLowerCase(), telefono: values.telefono.trim(),
      especialidad: values.especialidad, medico: values.medico, fecha: values.fecha, hora: values.hora,
      motivo: values.motivo.trim(), estado: "Pendiente", consentimiento: Boolean(values.consentimiento), fechaRegistro: new Date().toISOString()
    };
    const errors = window.PublicValidation.validateRequest(item, true);
    if (!window.PublicValidation.isFutureDate(item.fecha)) errors.push("La fecha debe ser futura.");
    if (!isSlotValid(item.medico, item.fecha, item.hora)) errors.push("El horario no está disponible para el médico seleccionado.");
    if (isDuplicate(item)) errors.push("Ya existe una reserva activa para el mismo correo, médico, fecha y hora.");
    else if (isOccupied(item)) errors.push("El horario ya fue reservado en este navegador.");
    if (errors.length) return { ok: false, errors };
    window.PublicStorage.upsert(item);
    return { ok: true, item };
  }
  function cancel(id) {
    const item = window.PublicStorage.find(id);
    if (!item) return false;
    window.PublicStorage.upsert({ ...item, estado: "Cancelada" });
    return true;
  }
  window.PublicReservations = { create, cancel, doctor, specialty, isSlotValid };
})();
