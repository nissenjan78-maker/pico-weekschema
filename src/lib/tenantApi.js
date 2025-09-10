// src/lib/tenantApi.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";

/* -------------------- USERS -------------------- */

export async function fetchTenantUsers(famId) {
  const col = collection(db, "tenants", famId, "users");
  const snap = await getDocs(col);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* -------------------- DAYPLAN -------------------- */
/**
 * Verwacht structuur:
 * tenants/{famId}/dayplan/{yyyy-mm-dd}/users/{userId}  -> { school: boolean }
 */
export async function fetchDayplanMap(famId) {
  const dayplanCol = collection(db, "tenants", famId, "dayplan");
  const daysSnap = await getDocs(dayplanCol);

  const result = {};
  for (const dayDoc of daysSnap.docs) {
    const dateKey = dayDoc.id;
    const usersSub = collection(dayDoc.ref, "users");
    const usersSnap = await getDocs(usersSub);
    usersSnap.forEach((uDoc) => {
      const uid = uDoc.id;
      const data = uDoc.data();
      result[uid] ??= {};
      result[uid][dateKey] = { school: !!data.school };
    });
  }
  return result;
}

/* -------------------- LIBRARY -------------------- */

export async function fetchLibrary(famId) {
  const colRef = collection(db, "tenants", famId, "library");
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/* -------------------- SCHEDULE -------------------- */
/**
 * schedule-doc:
 *  tenants/{famId}/schedule/{docId}
 *  fields:
 *   kidId: string
 *   dateKey: 'YYYY-MM-DD'
 *   slot: 'morning' | 'noon' | 'evening'
 *   items: [{id, label, icon}]
 */

export function subscribeSchedule(famId, cb) {
  const colRef = collection(db, "tenants", famId, "schedule");
  return onSnapshot(colRef, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(all);
  });
}

export async function upsertScheduleDoc(famId, { kidId, dateKey, slot }) {
  const docId = `${kidId}__${dateKey}__${slot}`;
  const ref = doc(db, "tenants", famId, "schedule", docId);
  const cur = await getDoc(ref);
  if (!cur.exists()) {
    await setDoc(ref, { kidId, dateKey, slot, items: [] });
  }
  return ref;
}

export async function addScheduleItem(famId, { kidId, dateKey, slot }, item) {
  const ref = await upsertScheduleDoc(famId, { kidId, dateKey, slot });
  await updateDoc(ref, {
    items: arrayUnion(item),
  });
}

export async function removeScheduleItem(famId, { kidId, dateKey, slot }, item) {
  const ref = await upsertScheduleDoc(famId, { kidId, dateKey, slot });
  await updateDoc(ref, {
    items: arrayRemove(item),
  });
}
