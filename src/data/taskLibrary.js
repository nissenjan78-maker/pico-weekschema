// Lichte datastore voor de Takenbibliotheek (localStorage)
// Biedt helpers, een event voor live-updates en een React hook.

const KEY = "weekschema.tasklibrary.v1";

const DEFAULTS = [
  // Een paar nuttige defaults — pas gerust aan
  { id: "tanden-poetsen", text: "Tanden Poetsen", picto: "Tandenpoetsen.png", tags: [] },
  { id: "ontbijt", text: "Ontbijt", picto: "Ontbijt.png", tags: [] },
  { id: "opstaan", text: "Opstaan", picto: "Opstaan.png", tags: [] },
  { id: "naar-school", text: "Naar school gaan", picto: "Naar school gaan.png", tags: ["school"] },
  { id: "lezen", text: "Lezen", picto: "Lezen.jpg", tags: [] },
  { id: "tablet", text: "Tablet", picto: "Tablet.png", tags: [] },
  { id: "douche", text: "Douchen", picto: "Douchen.png", tags: [] },
];

function readStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return DEFAULTS;
    return arr;
  } catch {
    return DEFAULTS;
  }
}

function writeStore(tasks) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
    // simple broadcast voor listeners
    window.dispatchEvent(new CustomEvent("tasklib:changed"));
  } catch {}
}

// Public API
export function getTaskLibrary() {
  return readStore();
}
export function saveTaskLibrary(tasks) {
  writeStore(tasks);
}
export function createTask(task) {
  const tasks = readStore();
  const id = task.id || genId(task.text);
  const newTask = {
    id,
    text: task.text?.trim() || "Nieuwe taak",
    picto: task.picto?.trim() || "",
    tags: Array.isArray(task.tags) ? task.tags : [],
  };
  tasks.push(newTask);
  writeStore(tasks);
  return newTask;
}
export function updateTask(id, patch) {
  const tasks = readStore();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const out = { ...tasks[idx], ...patch };
  // kleine cleanups
  out.text = out.text?.trim() || "Naamloze taak";
  out.picto = (out.picto || "").trim();
  out.tags = Array.isArray(out.tags) ? out.tags : [];
  tasks[idx] = out;
  writeStore(tasks);
  return out;
}
export function deleteTask(id) {
  const tasks = readStore().filter((t) => t.id !== id);
  writeStore(tasks);
}

export function resetTaskLibraryToDefaults() {
  writeStore(DEFAULTS);
}

// Event + React hook voor live updates (optioneel)
export function onTaskLibraryChange(cb) {
  window.addEventListener("tasklib:changed", cb);
  return () => window.removeEventListener("tasklib:changed", cb);
}

// Voor compatibiliteit met bestaand code: snapshot export.
// (Let op: dit is niet reactief; bij wijzigen even herladen.)
export const TASK_LIBRARY = getTaskLibrary();

// React hook: krijg altijd de laatste taken.
import { useEffect, useState } from "react";
export function useTaskLibrary() {
  const [tasks, setTasks] = useState(getTaskLibrary());
  useEffect(() => {
    const rerun = () => setTasks(getTaskLibrary());
    const off = onTaskLibraryChange(rerun);
    return () => off();
  }, []);
  return tasks;
}

// Helpers
function genId(name) {
  const base = (name || "taak")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}
