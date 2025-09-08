// src/data/devicesStore.js
import { useSyncExternalStore } from "react";
import { getFamily } from "./familyStore";

const STORAGE_KEY = "pico_devices_v1";
const LOCAL_DEVICE_ID_KEY = "pico_device_id_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function save(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

// In-memory lijst
let _devices = load();
const subs = new Set();
function emit() { save(_devices); subs.forEach(fn => fn()); }

// Helpers
export function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(LOCAL_DEVICE_ID_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() ||
        Math.random().toString(36).slice(2) + Date.now().toString(36));
      localStorage.setItem(LOCAL_DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function now() { return Date.now(); }

function detectPlatform() {
  try { return navigator.userAgent; } catch { return "unknown"; }
}

/* ------------- React hooks ------------- */
/** Belangrijk: getSnapshot geeft ALTIJD dezelfde referentie (_devices) terug
 *  zodat React geen infinite loop krijgt.
 */
export function useDevicesAll() {
  return useSyncExternalStore(
    (cb) => (subs.add(cb), () => subs.delete(cb)),
    () => _devices,
    () => _devices
  );
}

// Backwards compatible alias; filter buiten de store (in je hook/component)
export function useDevices() {
  return useDevicesAll();
}

/* ------------- Queries / utils ------------- */

export function getFamilyDevices(famId = getFamily().famId) {
  return _devices.filter(d => d.famId === famId);
}

export function getDeviceById(deviceId) {
  return _devices.find(d => d.deviceId === deviceId) || null;
}

/* ------------- Mutaties ------------- */

export function upsertDevice(dev) {
  const idx = _devices.findIndex(d => d.deviceId === dev.deviceId);
  if (idx >= 0) {
    _devices[idx] = { ..._devices[idx], ...dev, lastSeen: now() }; // ✅ fix
  } else {
    _devices = [..._devices, { ...dev, lastSeen: now() }];
  }
  emit();
}

export function removeDevice(deviceId) {
  _devices = _devices.filter(d => d.deviceId !== deviceId);
  emit();
}

export function ensureCurrentDevice({ famId, deviceId }) {
  const existing = getDeviceById(deviceId);
  if (existing) {
    upsertDevice({ ...existing, famId, lastSeen: now() });
    return existing;
  }
  const created = {
    deviceId,
    famId,
    label: "Nieuw apparaat",
    role: "ouder",          // default
    userId: undefined,
    forceKidMode: false,
    lastSeen: now(),
    platform: detectPlatform(),
  };
  upsertDevice(created);
  return created;
}

export function touchDevice(deviceId) {
  const d = getDeviceById(deviceId);
  if (!d) return;
  upsertDevice({ ...d, lastSeen: now() });
}

export function bindDeviceToUser(deviceId, userId) {
  const d = getDeviceById(deviceId);
  if (!d) return;
  upsertDevice({ ...d, userId });
}

export function setDeviceRole(deviceId, role) {
  const d = getDeviceById(deviceId);
  if (!d) return;
  upsertDevice({ ...d, role: (role || "ouder").toLowerCase() });
}

export function setDeviceLabel(deviceId, label) {
  const d = getDeviceById(deviceId);
  if (!d) return;
  upsertDevice({ ...d, label: String(label || "Apparaat") });
}

export function setDeviceForceKidMode(deviceId, value) {
  const d = getDeviceById(deviceId);
  if (!d) return;
  upsertDevice({ ...d, forceKidMode: !!value });
}
