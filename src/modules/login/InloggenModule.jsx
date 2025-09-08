import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, ensureAuth } from "../../lib/firebase"; // ← pas dit pad aan als jouw firebase-bestand elders staat

/* =========================================================
   InloggenModule.jsx
   - Device-gestuurde login: 1e keer koppelen aan gebruiker
   - Rollen: ouder | kind
   - Firestore:
       - households/default (bevat users[] met {id,name,role,avatar?,pin?})
       - deviceBindings/{deviceId} → { userId, deviceName, createdAt, updatedAt }
   ========================================================= */

/** ====== Config ====== */
const HOUSEHOLD_ID = "default";
const STORAGE_KEY_DEVICE_ID = "weekschema.deviceId";
const STORAGE_KEY_DEVICE_NAME = "weekschema.deviceName";

/** ====== Helpers ====== */
function genDeviceId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "dev_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
}

/** ====== Context ====== */
const LoginCtx = createContext(null);

export function useInloggen() {
  const ctx = useContext(LoginCtx);
  if (!ctx) throw new Error("useInloggen must be used inside <InloggenProvider>");
  return ctx;
}

/** Guard component: render alleen als rol matcht */
export function RoleGuard({ required, children, fallback = null }) {
  const { currentUser } = useInloggen();
  if (!currentUser) return fallback;
  if (required === "ouder" && currentUser.role !== "ouder") return fallback;
  if (required === "kind" && currentUser.role !== "kind") return fallback;
  return children;
}

/** Eenvoudige layout voor login/koppel-scherm – makkelijk te themen */
export function LoginLayout({ title = "Koppel dit toestel", children }) {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      background: "linear-gradient(180deg,#eef2ff,#ffffff)",
      padding: 16
    }}>
      <div style={{
        width: "100%",
        maxWidth: 520,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,.06)",
        padding: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "#eef2ff", display: "grid", placeItems: "center", border: "1px solid #c7d2fe"
          }}>🔐</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Provider die:
 *  - auth verzekert
 *  - deviceId beheert
 *  - binding (device→user) leest/schrijft
 *  - users uit household leest
 */
export function InloggenProvider({ children }) {
  const [authReady, setAuthReady] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [deviceName, setDeviceName] = useState(localStorage.getItem(STORAGE_KEY_DEVICE_NAME) || "");
  const [binding, setBinding] = useState(null); // {userId, deviceName, ...} of null
  const [users, setUsers] = useState(null);     // [{id,name,role,...}]
  const [loading, setLoading] = useState(true);

  // 1) Zorg voor auth
  useEffect(() => {
    (async () => {
      try {
        await ensureAuth();
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  // 2) Device-ID ophalen/aanmaken
  useEffect(() => {
    if (!authReady) return;
    let id = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!id) {
      id = genDeviceId();
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, id);
    }
    setDeviceId(id);
  }, [authReady]);

  // 3) Household users lezen
  useEffect(() => {
    if (!authReady) return;
    const ref = doc(db, "households", HOUSEHOLD_ID);
    // live meevolgen:
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() || {};
      const us = Array.isArray(d.users) ? d.users : [];
      setUsers(us);
    }, () => {
      setUsers([]);
    });
    return () => unsub();
  }, [authReady]);

  // 4) Binding doc live volgen
  useEffect(() => {
    if (!deviceId) return;
    const ref = doc(db, "deviceBindings", deviceId);
    const unsub = onSnapshot(ref, (snap) => {
      setBinding(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [deviceId]);

  /** Huidige user object uit users[] op basis van binding.userId */
  const currentUser = useMemo(() => {
    if (!binding || !users) return null;
    return users.find(u => u.id === binding.userId) || null;
  }, [binding, users]);

  const isParent = currentUser?.role === "ouder";

  /** Device ⇄ user koppelen */
  const bindDeviceToUser = useCallback(async ({ userId, deviceName: nameInput }) => {
    if (!deviceId) throw new Error("Geen deviceId beschikbaar");
    if (!userId) throw new Error("userId ontbreekt");
    const name = (nameInput || deviceName || "").trim() || "Mijn toestel";
    // opslaan in localStorage voor UX
    localStorage.setItem(STORAGE_KEY_DEVICE_NAME, name);
    setDeviceName(name);

    const ref = doc(db, "deviceBindings", deviceId);
    await setDoc(ref, {
      userId,
      deviceName: name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, [deviceId, deviceName]);

  /** Device hernoemen */
  const renameDevice = useCallback(async (newName) => {
    if (!deviceId) return;
    const name = (newName || "").trim();
    localStorage.setItem(STORAGE_KEY_DEVICE_NAME, name);
    setDeviceName(name);
    const ref = doc(db, "deviceBindings", deviceId);
    await updateDoc(ref, { deviceName: name, updatedAt: serverTimestamp() });
  }, [deviceId]);

  /** Device opnieuw toewijzen (alleen ouder-UI gebruiken) */
  const reassignDevice = useCallback(async ({ targetDeviceId, userId }) => {
    if (!targetDeviceId) throw new Error("reassignDevice: targetDeviceId ontbreekt");
    if (!userId) throw new Error("reassignDevice: userId ontbreekt");
    const ref = doc(db, "deviceBindings", targetDeviceId);
    await setDoc(ref, {
      userId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, []);

  /** Device-koppeling verwijderen (alleen ouder-UI of dit device zelf) */
  const deleteDeviceBinding = useCallback(async (targetDeviceId) => {
    if (!targetDeviceId) throw new Error("deleteDeviceBinding: targetDeviceId ontbreekt");
    await deleteDoc(doc(db, "deviceBindings", targetDeviceId));
  }, []);

  /** Alle bindings ophalen voor ouderoverzicht */
  const useAllBindings = () => {
    const [all, setAll] = useState([]);
    useEffect(() => {
      const unsub = onSnapshot(doc(db, "households", HOUSEHOLD_ID), () => {
        // noop: dit triggert niks direct; alleen om household consistent te houden
      });
      // We volgen geen collectionQuery hier om module compact te houden.
      // Tip: maak een klein panel dat op devices pagina zelf de list query uitvoert.
      return () => unsub();
    }, []);
    // Simpele helper voor parent-scherm: je kunt elders zelf een collection listener bouwen.
    return all;
  };

  const ctxValue = useMemo(() => ({
    // state
    authReady,
    loading,
    deviceId,
    deviceName,
    binding,
    users,
    currentUser,
    isParent,
    // actions
    bindDeviceToUser,
    renameDevice,
    reassignDevice,
    deleteDeviceBinding,
    useAllBindings,
  }), [
    authReady, loading, deviceId, deviceName, binding, users, currentUser, isParent,
    bindDeviceToUser, renameDevice, reassignDevice, deleteDeviceBinding
  ]);

  return (
    <LoginCtx.Provider value={ctxValue}>
      {children}
    </LoginCtx.Provider>
  );
}

/** === UI: eerste-koppeling (popup/pagina) ===
 *  Toon dit component wanneer er géén binding is.
 *  Je kunt dit overal plaatsen (bijv. bovenaan App) en conditioneel renderen:
 *
 *  const { binding } = useInloggen();
 *  if (!binding) return <KoppelDeviceView />;
 */
export function KoppelDeviceView() {
  const { users, bindDeviceToUser, deviceName, renameDevice } = useInloggen();
  const [pickedUser, setPickedUser] = useState("");
  const [name, setName] = useState(deviceName || "");

  const kids = (users || []).filter(u => u.role === "kind");
  const parents = (users || []).filter(u => u.role === "ouder");

  // Tip: voor ouders kun je hier optioneel nog pincode vragen.
  async function handleConfirm() {
    if (!pickedUser) return;
    await bindDeviceToUser({ userId: pickedUser, deviceName: name });
  }

  return (
    <LoginLayout title="Koppel dit toestel aan een gebruiker">
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#374151" }}>Toestelnaam</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => renameDevice(name)}
          placeholder="Bijv. Tablet woonkamer"
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
        />
      </label>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Kies gebruiker</div>

        {!!kids.length && (
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Kinderen</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {kids.map(u => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setPickedUser(u.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: pickedUser === u.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    background: pickedUser === u.id ? "#e0e7ff" : "#fff",
                    cursor: "pointer",
                    minWidth: 120,
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>kind</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!!parents.length && (
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", margin: "8px 0 6px" }}>Ouders</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {parents.map(u => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => {
                    // Optioneel: vraag PIN hier
                    setPickedUser(u.id);
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: pickedUser === u.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    background: pickedUser === u.id ? "#e0e7ff" : "#fff",
                    cursor: "pointer",
                    minWidth: 120,
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>ouder</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!pickedUser}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #1e40af",
            background: !pickedUser ? "#9ca3af" : "#2563eb",
            color: "#fff",
            fontWeight: 800,
            cursor: !pickedUser ? "not-allowed" : "pointer"
          }}
        >
          Koppelen
        </button>
      </div>
    </LoginLayout>
  );
}

/** ====== Voorbeeld gebruik in je App ======
 *
 * import { InloggenProvider, useInloggen, KoppelDeviceView, RoleGuard } from "./modules/inloggen/InloggenModule";
 *
 * function Gate() {
 *   const { binding, currentUser } = useInloggen();
 *   if (!binding) return <KoppelDeviceView />;      // 1e keer koppelen
 *   if (!currentUser) return <div>Laden…</div>;     // users nog niet binnen
 *   return <AppContent />;                          // toon je echte app
 * }
 *
 * export default function App() {
 *   return (
 *     <InloggenProvider>
 *       <Gate />
 *     </InloggenProvider>
 *   );
 * }
 *
 * // In je app kun je nu RoleGuard gebruiken:
 * // <RoleGuard required="ouder"><AdminPane /></RoleGuard>
 */
