// src/useFirestoreSync.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
// Pas dit pad aan als jouw firebase-bestand elders staat:
import { db, ensureAuth } from "./lib/firebase";

/** Verwijder alle `undefined` waarden diep in een structuur (objects & arrays). */
function stripUndefinedDeep(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (Array.isArray(value)) {
    const arr = value
      .map((v) => stripUndefinedDeep(v))
      .filter((v) => v !== undefined); // geen undefined in arrays
    return arr;
  }
  if (t === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const cv = stripUndefinedDeep(v);
      if (cv !== undefined) out[k] = cv; // laat sleutel vallen als undefined
    }
    return out;
  }
  return value;
}

export function useFirestoreSync() {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureAuth();

        const ref = doc(db, "households", "default");
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            users: [],
            tasks: [],
            library: [],
            suppressions: [],
            completions: [],
            timers: [],
            sortOrders: {},
            blockOverrides: {},
            planned: {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        unsubRef.current = onSnapshot(
          ref,
          (docSnap) => {
            if (cancelled) return;
            setData(docSnap.data() || {});
            setReady(true);
          },
          (err) => {
            console.error("Firestore onSnapshot error:", err);
            setError(err);
            setReady(true);
          }
        );
      } catch (e) {
        console.error(e);
        setError(e);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        unsubRef.current && unsubRef.current();
      } catch {}
    };
  }, []);

  /** Merge-write helper. Verwijdert undefined dieper in de payload. */
  const save = useCallback(async (partial) => {
    const ref = doc(db, "households", "default");
    const body =
      partial && typeof partial === "object" ? stripUndefinedDeep(partial) : {};
    // voeg alleen top-level updatedAt toe (niet in arrays)
    await setDoc(
      ref,
      { ...body, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }, []);

  // Veilige defaults naar de UI
  const safeData = useMemo(() => {
    const d = data || {};
    return {
      users: Array.isArray(d.users) ? d.users : [],
      tasks: Array.isArray(d.tasks) ? d.tasks : [],
      library: Array.isArray(d.library) ? d.library : [],
      suppressions: Array.isArray(d.suppressions) ? d.suppressions : [],
      completions: Array.isArray(d.completions) ? d.completions : [],
      timers: Array.isArray(d.timers) ? d.timers : [],
      sortOrders: d.sortOrders && typeof d.sortOrders === "object" ? d.sortOrders : {},
      blockOverrides: d.blockOverrides && typeof d.blockOverrides === "object" ? d.blockOverrides : {},
      planned: d.planned && typeof d.planned === "object" ? d.planned : {},
    };
  }, [data]);

  return { data: safeData, save, ready, error };
}
