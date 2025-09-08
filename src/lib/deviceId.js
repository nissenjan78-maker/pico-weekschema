// src/lib/deviceId.js
const LS_KEY = "device_id_v1";

// Heel simpele, stabiele device-ID. Wijzigt niet tussen pagina-herlaad/updates.
export function getOrCreateDeviceId() {
  let id = localStorage.getItem(LS_KEY);
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    localStorage.setItem(LS_KEY, id);
  }
  return id;
}
