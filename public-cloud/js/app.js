(function () {
  "use strict";
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => [...(root || document).querySelectorAll(selector)];
  function text(node, value) { if (node) node.textContent = value == null ? "" : String(value); }
  function escapeForText(value) { return String(value == null ? "" : value); }
  function formatDate(value) { try { return new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(new Date(value + "T12:00:00")); } catch (_) { return value; } }
  function envLabel() {
    const host = location.hostname;
    return host && host !== "localhost" && host !== "127.0.0.1" ? "Entorno público: Render Cloud" : "Entorno local de demostración";
  }
  function toast(message, type) {
    let region = $(".toast-region");
    if (!region) { region = document.createElement("div"); region.className = "toast-region"; region.setAttribute("aria-live", "polite"); document.body.appendChild(region); }
    const item = document.createElement("div"); item.className = "toast " + (type || ""); item.textContent = message; region.appendChild(item); setTimeout(() => item.remove(), 4500);
  }
  function initShell() {
    text($("#environment-label"), envLabel());
    const toggle = $("#nav-toggle"), nav = $("#main-nav");
    if (toggle && nav) toggle.addEventListener("click", () => { const open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", String(open)); });
    text($("#year"), new Date().getFullYear());
  }
  function buildCards() {
    const specialtyGrid = $("#specialty-grid");
    if (specialtyGrid) window.SantivanezPublicData.specialties.forEach((item) => {
      const card = document.createElement("article"); card.className = "card specialty-card";
      const icon = document.createElement("div"); icon.className = "card-icon"; icon.setAttribute("aria-hidden", "true"); text(icon, item.icon);
      const title = document.createElement("h3"); text(title, item.name); const p = document.createElement("p"); text(p, item.description);
      const link = document.createElement("a"); link.className = "btn btn-secondary btn-small"; link.href = "reservar.html?especialidad=" + encodeURIComponent(item.id); text(link, "Reservar consulta");
      card.append(icon, title, p, link); specialtyGrid.appendChild(card);
    });
    const doctorGrid = $("#doctor-grid");
    if (doctorGrid) window.SantivanezPublicData.doctors.forEach((item) => {
      const card = document.createElement("article"); card.className = "card doctor-card";
      const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.setAttribute("aria-hidden", "true"); text(avatar, item.name.split(" ").slice(1,3).map((v) => v[0]).join(""));
      const body = document.createElement("div"), title = document.createElement("h3"), detail = document.createElement("p"), tags = document.createElement("div"), link = document.createElement("a");
      const spec = window.PublicReservations.specialty(item.specialty); text(title, item.name); text(detail, (spec ? spec.name : item.specialty) + " · " + item.license); tags.className = "tag-list";
      item.days.forEach((day) => { const tag = document.createElement("span"); tag.className = "tag"; text(tag, day); tags.appendChild(tag); });
      link.className = "btn btn-secondary btn-small"; link.href = "reservar.html?medico=" + encodeURIComponent(item.id); text(link, "Ver horarios"); body.append(title, detail, tags, link); card.append(avatar, body); doctorGrid.appendChild(card);
    });
  }
  function setOptions(select, items, placeholder, labelFn) {
    select.replaceChildren(); const empty = document.createElement("option"); empty.value = ""; text(empty, placeholder); select.appendChild(empty);
    items.forEach((item) => { const option = document.createElement("option"); option.value = item.id || item; text(option, labelFn ? labelFn(item) : item.name || item); select.appendChild(option); });
  }
  function initReservationForm() {
    const form = $("#reservation-form"); if (!form) return;
    const specialtySelect = $("#especialidad"), doctorSelect = $("#medico"), hourSelect = $("#hora"), dateInput = $("#fecha");
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); dateInput.min = tomorrow.toISOString().slice(0,10);
    setOptions(specialtySelect, window.SantivanezPublicData.specialties, "Seleccione una especialidad");
    const query = new URLSearchParams(location.search); if (query.get("especialidad")) specialtySelect.value = query.get("especialidad");
    function refreshDoctors(preselected) {
      const rows = window.SantivanezPublicData.doctors.filter((row) => !specialtySelect.value || row.specialty === specialtySelect.value);
      setOptions(doctorSelect, rows, "Seleccione un médico"); if (preselected && rows.some((row) => row.id === preselected)) doctorSelect.value = preselected; refreshHours();
    }
    function refreshHours() {
      const row = window.PublicReservations.doctor(doctorSelect.value); setOptions(hourSelect, row ? row.hours : [], "Seleccione una hora");
      const hint = $("#schedule-hint"); text(hint, row ? "Atiende: " + row.days.join(", ") + ". Horarios sujetos a disponibilidad local." : "Seleccione un médico para ver su horario.");
    }
    specialtySelect.addEventListener("change", () => refreshDoctors()); doctorSelect.addEventListener("change", refreshHours); refreshDoctors(query.get("medico"));
    if (query.get("medico")) { const row = window.PublicReservations.doctor(query.get("medico")); if (row) { specialtySelect.value = row.specialty; refreshDoctors(row.id); } }
    form.addEventListener("submit", (event) => {
      event.preventDefault(); $("#reservation-result").replaceChildren();
      const values = Object.fromEntries(new FormData(form).entries()); values.consentimiento = $("#consentimiento").checked;
      const result = window.PublicReservations.create(values);
      if (!result.ok) { showMessage($("#reservation-result"), "No se pudo registrar", result.errors.join(" "), "error"); return; }
      const wrapper = $("#reservation-result"); wrapper.className = "result-panel banner banner-success";
      const title = document.createElement("strong"), p = document.createElement("p"), code = document.createElement("span"), actions = document.createElement("div"), exportButton = document.createElement("button"), consult = document.createElement("a");
      text(title, "Reserva registrada correctamente"); text(p, "Guarde este UUID para consultar el estado: "); code.className = "code"; text(code, result.item.uuid); p.appendChild(code);
      actions.className = "actions"; exportButton.type = "button"; exportButton.className = "btn btn-success btn-small"; text(exportButton, "Exportar JSON"); exportButton.addEventListener("click", () => window.PublicSync.exportReservation(result.item.uuid));
      consult.className = "btn btn-secondary btn-small"; consult.href = "consultar.html?codigo=" + encodeURIComponent(result.item.uuid); text(consult, "Consultar estado"); actions.append(exportButton, consult); wrapper.append(title, p, actions); form.reset(); refreshDoctors(); toast("Reserva guardada en este navegador.", "success");
    });
  }
  function showMessage(target, titleValue, bodyValue, type) {
    target.replaceChildren(); target.className = "result-panel banner banner-" + type; const title = document.createElement("strong"), p = document.createElement("p"); text(title, titleValue); text(p, bodyValue); target.append(title, p);
  }
  function reservationResult(item, target) {
    target.replaceChildren(); target.className = "result-panel card";
    const title = document.createElement("h3"), status = document.createElement("span"), details = document.createElement("div"), actions = document.createElement("div");
    text(title, "Reserva encontrada"); status.className = "status status-" + item.estado.toLowerCase(); text(status, item.estado);
    details.className = "grid grid-2";
    const rows = [
      ["Código", item.uuid], ["Especialidad", (window.PublicReservations.specialty(item.especialidad) || {}).name || item.especialidad],
      ["Médico", (window.PublicReservations.doctor(item.medico) || {}).name || item.medico], ["Fecha y hora", formatDate(item.fecha) + " · " + item.hora]
    ];
    rows.forEach(([labelValue, value]) => { const box = document.createElement("div"), label = document.createElement("strong"), p = document.createElement("p"); text(label, labelValue); text(p, value); box.append(label, p); details.appendChild(box); });
    actions.className = "actions"; const exportButton = document.createElement("button"); exportButton.type = "button"; exportButton.className = "btn btn-secondary btn-small"; text(exportButton, "Exportar reserva JSON"); exportButton.addEventListener("click", () => window.PublicSync.exportReservation(item.uuid)); actions.appendChild(exportButton);
    if (item.estado !== "Cancelada" && item.estado !== "Rechazada") { const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "btn btn-danger btn-small"; text(cancel, "Cancelar reserva"); cancel.addEventListener("click", () => confirmCancel(item.uuid)); actions.appendChild(cancel); }
    target.append(title, status, details, actions);
  }
  function confirmCancel(id) {
    const modal = $("#cancel-modal"); if (!modal) return;
    modal.showModal(); const button = $("#confirm-cancel"); button.onclick = () => { window.PublicReservations.cancel(id); modal.close(); const updated = window.PublicStorage.find(id); reservationResult(updated, $("#lookup-result")); toast("La reserva fue cancelada.", "success"); };
  }
  function initLookup() {
    const form = $("#lookup-form"); if (!form) return; const input = $("#codigo"), target = $("#lookup-result"); const query = new URLSearchParams(location.search); input.value = query.get("codigo") || "";
    const closeButton = $("#close-cancel"), modal = $("#cancel-modal"); if (closeButton && modal) closeButton.addEventListener("click", () => modal.close());
    form.addEventListener("submit", (event) => { event.preventDefault(); const id = input.value.trim(); if (!window.PublicValidation.UUID_RE.test(id)) return showMessage(target, "Código inválido", "Ingrese un UUID de reserva válido.", "error"); const item = window.PublicStorage.find(id); if (!item) return showMessage(target, "Sin resultados", "No existe una reserva con ese código en este navegador.", "warning"); reservationResult(item, target); });
    if (input.value) form.requestSubmit();
  }
  function initSync() {
    const exportForm = $("#export-form"); if (exportForm) exportForm.addEventListener("submit", (event) => { event.preventDefault(); const id = $("#export-code").value.trim(); try { window.PublicSync.exportReservation(id); showMessage($("#sync-result"), "Exportación preparada", "El archivo contiene únicamente los datos mínimos de la reserva.", "success"); } catch (error) { showMessage($("#sync-result"), "No se pudo exportar", error.message, "error"); } });
    const importForm = $("#import-form"); if (importForm) importForm.addEventListener("submit", async (event) => { event.preventDefault(); const target = $("#sync-result"); showMessage(target, "Validando archivo", "Se revisan estructura, UUID, fechas y campos permitidos.", "info"); try { const response = await window.PublicSync.importStatus($("#status-file").files[0]); showMessage(target, "Estado actualizado", "La reserva " + response.uuid + " ahora está: " + response.estado + ".", "success"); } catch (error) { showMessage(target, "Archivo rechazado", error.message, "error"); } });
  }
  function initReminders() {
    const list = $("#reminder-list"); if (!list) return; const items = window.PublicStorage.list().filter((item) => item.consentimiento && !["Cancelada", "Rechazada"].includes(item.estado));
    list.replaceChildren(); if (!items.length) { const empty = document.createElement("div"); empty.className = "empty-state card"; text(empty, "No hay recordatorios simulados en este navegador."); list.appendChild(empty); return; }
    items.sort((a,b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)).forEach((item) => { const card = document.createElement("article"); card.className = "card"; const title = document.createElement("h3"), p = document.createElement("p"), status = document.createElement("span"); text(title, "Cita: " + formatDate(item.fecha)); text(p, ((window.PublicReservations.doctor(item.medico) || {}).name || item.medico) + " · " + item.hora + ". Recordatorio de demostración: confirme su asistencia."); status.className = "status status-" + item.estado.toLowerCase(); text(status, item.estado); card.append(title, p, status); list.appendChild(card); });
  }
  document.addEventListener("DOMContentLoaded", () => { initShell(); buildCards(); initReservationForm(); initLookup(); initSync(); initReminders(); });
  window.SantivanezUI = { toast, showMessage, escapeForText };
})();
