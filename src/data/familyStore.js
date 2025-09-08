// src/data/familyStore.js
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "pico_family_v1";

// Default familie (één gezin)
const defaultFamily = {
  famId: "FAM-0001",            // willekeurig/gegenereerd in productie
  parentPin: "1608",            // pincode voor ouder-modus
  plan: { parents: 1, kids: 2 } // abonnement-limieten
};

let _family = load() ?? defaultFamily;
const subs = new Set();

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_family)); } catch {}
}
function emit() { save(); subs.forEach(fn => fn()); }

export function useFamily() {
  return useSyncExternalStore(
    (cb) => (subs.add(cb), () => subs.delete(cb)),
    () => _family,
    () => _family
  );
}

export function getFamily() { return _family; }

export function updateFamily(patch) {
  _family = { ..._family, ...patch };
  emit();
}

export function setPlan(plan) {
  // plan={parents: number, kids: number}
  _family = { ..._family, plan: { ..._family.plan, ...plan } };
  emit();
}

export function setPin(newPin) {
  _family = { ..._family, parentPin: String(newPin || "").trim() || "1608" };
  emit();
}
