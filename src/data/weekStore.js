// src/data/weekStore.js
import { useSyncExternalStore } from "react";
import { getFamily } from "./familyStore";

const ASSIGN_KEY = "pico_week_assignments_v1";
const SETTINGS_KEY = "pico_week_daysettings_v1";

/* ---------------------- utils ---------------------- */
function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function uuid() {
  try { return crypto.randomUUID(); }
  catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
}

export function fmtDate(d) {
  const dt = (d instanceof Date) ? d : new Date(d);
  const y = dt.getFullYear();
  const m = `${dt.getMonth()+1}`.padStart(2, "0");
  const day = `${dt.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeek(d, weekStartsOn=1 /* ma */) {
  const dt = new Date(d);
  const day = dt.getDay(); // 0..6 (zo..za)
  const diff = (day === 0 ? 7 : day) - weekStartsOn; // zo => 7
  dt.setDate(dt.getDate() - diff);
  dt.setHours(0,0,0,0);
  return dt;
}

export function addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate()+n);
  return dt;
}

/* ---------------------- in-memory stores ---------------------- */
let _assignments = load(ASSIGN_KEY);   // Array<Assignment>
let _settings = load(SETTINGS_KEY);    // Array<DaySettings>

const subsA = new Set();
const subsS = new Set();
function emitA(){ save(ASSIGN_KEY, _assignments); subsA.forEach(fn => fn()); }
function emitS(){ save(SETTINGS_KEY, _settings); subsS.forEach(fn => fn()); }

/* ---------------------- hooks: stable snapshots ---------------------- */
export function useAssignmentsAll() {
  return useSyncExternalStore(
    cb => (subsA.add(cb), () => subsA.delete(cb)),
    () => _assignments,
    () => _assignments
  );
}
export function useDaySettingsAll() {
  return useSyncExternalStore(
    cb => (subsS.add(cb), () => subsS.delete(cb)),
    () => _settings,
    () => _settings
  );
}

/* ---------------------- queries (pure) ---------------------- */
export function listAssignmentsRange(famId, childId, start, end) {
  const s = new Date(fmtDate(start)).getTime();
  const e = new Date(fmtDate(end)).getTime();
  return _assignments
    .filter(a => a.famId === famId && a.childId === childId)
    .filter(a => {
      const t = new Date(a.date).getTime();
      return t >= s && t <= e;
    })
    .sort((a,b) => a.date.localeCompare(b.date) || a.part.localeCompare(b.part) || (a.order - b.order));
}

export function getDaySettings(famId, childId, date) {
  return _settings.find(s => s.famId===famId && s.childId===childId && s.date===fmtDate(date)) || null;
}

/* ---------------------- mutations ---------------------- */
export function upsertAssignment(a) {
  const idx = _assignments.findIndex(x => x.id === a.id);
  if (idx >= 0) _assignments[idx] = { ..._assignments[idx], ...a };
  else _assignments = [..._assignments, { id: uuid(), order: 999, ...a }];
  emitA();
}

export function createAssignment({ famId, childId, date, part, taskId, order }) {
  const a = { id: uuid(), famId, childId, date: fmtDate(date), part, taskId, order: order ?? 999 };
  _assignments = [..._assignments, a];
  emitA();
  return a;
}

export function removeAssignment(id) {
  _assignments = _assignments.filter(a => a.id !== id);
  emitA();
}

export function clearWeek(famId, childId, start, end) {
  const s = new Date(fmtDate(start)).getTime();
  const e = new Date(fmtDate(end)).getTime();
  _assignments = _assignments.filter(a => {
    if (a.famId !== famId || a.childId !== childId) return true;
    const t = new Date(a.date).getTime();
    return !(t >= s && t <= e);
  });
  emitA();
}

export function copyDay(famId, childId, srcDate, dstDate) {
  const srcStr = fmtDate(srcDate);
  const dstStr = fmtDate(dstDate);
  const srcItems = _assignments
    .filter(a => a.famId===famId && a.childId===childId && a.date===srcStr)
    .sort((a,b)=>a.part.localeCompare(b.part)||a.order-b.order);
  srcItems.forEach(a => {
    _assignments.push({ ...a, id: uuid(), date: dstStr });
  });
  emitA();
}

export function setDaySettings(famId, childId, date, patch) {
  const d = fmtDate(date);
  const idx = _settings.findIndex(s => s.famId===famId && s.childId===childId && s.date===d);
  const def = {
    famId, childId, date: d,
    morning: { start: "07:00", end: "08:15" },
    noon: { start: "12:00", end: "13:30", school: { enabled:false, start:"08:30", end:"15:30" } },
    evening: { start: "18:30", end: "20:30" },
  };
  if (idx >= 0) _settings[idx] = { ...def, ..._settings[idx], ...patch };
  else _settings = [..._settings, { ...def, ...patch }];
  emitS();
}

/* convenience */
export function reorderWithinCell(famId, childId, date, part) {
  const items = _assignments
    .filter(a => a.famId===famId && a.childId===childId && a.date===fmtDate(date) && a.part===part)
    .sort((a,b)=>a.order-b.order);
  items.forEach((a,i)=> { a.order = i; });
  emitA();
}
