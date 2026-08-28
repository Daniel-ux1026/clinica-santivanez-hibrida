(function () {
  "use strict";
  function download(name, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  function readJsonFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json")) return reject(new Error("Seleccione un archivo con extensión .json."));
      if (file.size > 256 * 1024) return reject(new Error("El archivo supera el límite de 256 KB."));
      const reader = new FileReader();
      reader.onload = () => { try { resolve(JSON.parse(reader.result)); } catch (_) { reject(new Error("El contenido no es JSON válido.")); } };
      reader.onerror = () => reject(new Error("No fue posible leer el archivo.")); reader.readAsText(file, "utf-8");
    });
  }
  function exportReservation(id) {
    const item = window.PublicStorage.find(id);
    if (!item) throw new Error("No se encontró la reserva indicada.");
    const allowed = ["uuid", "nombre", "correo", "telefono", "especialidad", "medico", "fecha", "hora", "motivo", "estado", "consentimiento", "fechaRegistro"];
    const payload = Object.fromEntries(allowed.map((key) => [key, item[key]]));
    const errors = window.PublicValidation.validateRequest(payload, true);
    if (errors.length) throw new Error(errors.join(" "));
    download("reserva-" + item.uuid + ".json", payload);
  }
  async function importStatus(file) {
    const response = await readJsonFile(file);
    const errors = window.PublicValidation.validateResponse(response);
    if (errors.length) throw new Error(errors.join(" "));
    const item = window.PublicStorage.find(response.uuid);
    if (!item) throw new Error("El UUID de la respuesta no corresponde a una reserva de este navegador.");
    const current = Date.parse(item.fechaActualizacion || item.fechaRegistro);
    if (Date.parse(response.fechaActualizacion) <= current) throw new Error("La respuesta es duplicada o anterior al estado ya registrado.");
    window.PublicStorage.upsert({ ...item, estado: response.estado, fecha: response.fecha, hora: response.hora, fechaActualizacion: response.fechaActualizacion });
    return response;
  }
  window.PublicSync = { download, readJsonFile, exportReservation, importStatus };
})();
