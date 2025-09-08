// src/data/usersStore.js
import { useSyncExternalStore } from "react";
import { getFamily } from "./familyStore";

const STORAGE_KEY = "pico_users_v2";

let _users = load() ?? [
  // standaard gezin in FAM-0001
  { id: "papa", famId: "FAM-0001", name: "Papa", role: "ouder", avatar: "Papa.png" },
  { id: "leon", famId: "FAM-0001", name: "Leon", role: "kind",  avatar: "Leon.png" },
  { id: "lina", famId: "FAM-0001", name: "Lina", role: "kind",  avatar: "Lina.png" },
];

const subs = new Set();

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; } }
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_users)); } catch {} }
function emit() { save(); subs.forEach(fn => fn()); }

export function useUsers() {
  return useSyncExternalStore(
    (cb) => (subs.add(cb), () => subs.delete(cb)),
    () => _users,
    () => _users
  );
}
export function getUsers() { return _users.slice(); }

// Helpers
function familyUsers(famId) {
  return _users.filter(u => u.famId === famId);
}
function countByRole(famId, role) {
  return familyUsers(famId).filter(u => (u.role || "").toLowerCase() === role).length;
}

export function createUser(partial = {}) {
  const famId = partial.famId || getFamily().famId;
  const role = (partial.role || "kind").toLowerCase();
  const plan = getFamily().plan;

  // plan-enforcement
  if (role === "ouder" && countByRole(famId, "ouder") >= (plan.parents ?? 1)) {
    throw new Error(`Limiet bereikt: maximaal ${plan.parents} ouder(s).`);
  }
  if (role === "kind" && countByRole(famId, "kind") >= (plan.kids ?? 0)) {
    throw new Error(`Limiet bereikt: maximaal ${plan.kids} kind(eren).`);
  }

  const id = (partial.id || Math.random().toString(36).slice(2, 10)).toLowerCase();
  const user = {
    id,
    famId,
    name: partial.name || "Nieuwe gebruiker",
    role,
    avatar: partial.avatar || "avatar.png",
  };
  _users = [..._users, user];
  emit();
  return user;
}

export function updateUser(id, patch = {}) {
  _users = _users.map(u => (u.id === id ? { ...u, ...patch } : u));
  emit();
}

export function deleteUser(id) {
  // Bescherm: minstens 1 ouder per familie behouden
  const user = _users.find(u => u.id === id);
  if (!user) return;
  const famId = user.famId;
  const role = (user.role || "").toLowerCase();
  if (role === "ouder" && countByRole(famId, "ouder") <= 1) {
    throw new Error("Kan laatste ouder niet verwijderen.");
  }
  _users = _users.filter(u => u.id !== id);
  emit();
}

export function getFamilyUsers(famId = getFamily().famId) {
  return familyUsers(famId);
}
