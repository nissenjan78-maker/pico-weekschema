import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, firebaseReady } from "../lib/firebase";

export function useHousehold(householdId) {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseReady || !db || !householdId) {
      setData(null);
      setReady(false);
      setLoading(false);
      return;
    }
    const ref = doc(db, "households", householdId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setReady(true);
        setLoading(false);
      },
      (err) => {
        console.error("[useHousehold] onSnapshot error:", err);
        setError(err);
        setReady(false);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [householdId]);

  const libraryById    = useMemo(() => data?.library?.byId || {}, [data]);
  const planned        = useMemo(() => data?.planned || {}, [data]);
  const blockOverrides = useMemo(() => data?.blockOverrides || {}, [data]);

  return { data, ready, loading, error, libraryById, planned, blockOverrides };
}
