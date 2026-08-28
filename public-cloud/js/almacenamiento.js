(function () {
  "use strict";
  const KEY = "santivanez_public_reservas_v1";
  const safeParse = (value, fallback) => {
    try { return JSON.parse(value) || fallback; } catch (_) { return fallback; }
  };
  window.PublicStorage = {
    list() { return safeParse(localStorage.getItem(KEY), []); },
    save(items) { localStorage.setItem(KEY, JSON.stringify(items)); },
    find(uuid) { return this.list().find((item) => item.uuid === String(uuid || "").trim()); },
    upsert(item) {
      const items = this.list();
      const index = items.findIndex((row) => row.uuid === item.uuid);
      if (index >= 0) items[index] = item; else items.push(item);
      this.save(items);
      return item;
    },
    remove(uuid) {
      const items = this.list();
      const next = items.filter((item) => item.uuid !== uuid);
      this.save(next);
      return next.length !== items.length;
    }
  };
})();
