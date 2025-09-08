import React, { useEffect, useMemo, useState } from "react";
import { Header_Parent, Header_Kids } from "./modules/header";

// hooks – laat zoals bij jou aanwezig
import * as FirestoreSyncMod from "./useFirestoreSync";
import * as DeviceBindingMod from "./lib/useDeviceBinding";
const useFirestoreSync =
  FirestoreSyncMod.default || FirestoreSyncMod.useFirestoreSync || (() => ({}));
const useDeviceBinding =
  DeviceBindingMod.default || DeviceBindingMod.useDeviceBinding || (() => ({}));

// ouder-panels
import ParentHome from "./modules/parent/ParentHome";
import WeekSchedulePanel from "./modules/parent/panels/WeekSchedulePanel";
import BlocksPanel from "./modules/parent/panels/BlocksPanel";
import UsersPanel from "./modules/parent/panels/UsersPanel";
import DevicesPanel from "./modules/parent/panels/DevicesPanel";
import LibraryPanel from "./modules/parent/panels/LibraryPanel";

// kids
import KidsDaySummary from "./modules/kind/KidsDaySummary";
import KidsBlocks from "./modules/kind/KidsBlocks";

// data (plaatsvervangers)
import { TASK_LIBRARY } from "./data/taskLibrary";
import { ASSIGNMENTS } from "./data/assignments";

/* ---------- helpers ---------- */

const DEMO_USERS = [
  { id: "papa", name: "Papa", role: "ouder", avatar: "Papa.png" },
  { id: "leon", name: "Leon", role: "kind", avatar: "Leon.png" },
  { id: "lina", name: "Lina", role: "kind", avatar: "Lina.png" },
];

const LS_USER_KEY = "weekschema.currentUserId";
const LS_MODE_KEY = "weekschema.mode";
const LS_PIN_OK = "pin.ok";

const ls = {
  get(k) {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k, v) {
    try { localStorage.setItem(k, v); } catch {}
  },
  del(k) {
    try { localStorage.removeItem(k); } catch {}
  },
};

function pickValidUserId(users, preferredId, deviceUserId) {
  if (!users?.length) return null;
  if (preferredId && users.some((u) => u.id === preferredId)) return preferredId;
  if (deviceUserId && users.some((u) => u.id === deviceUserId)) return deviceUserId;
  const p = users.find((u) => u.role === "ouder");
  return p ? p.id : users[0].id;
}

/* ---------- PIN-gate ---------- */

function PinGate({ required, onUnlock }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  if (!required) return null;

  const submit = (e) => {
    e.preventDefault();
    if (pin.trim() === "1608") {
      ls.set(LS_PIN_OK, "1");
      setErr("");
      onUnlock?.();
    } else {
      setErr("Foute pincode");
    }
  };

  const logout = () => {
    ls.del(LS_PIN_OK);
    setPin("");
    setErr("");
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="w-[min(92vw,460px)] rounded-2xl bg-white p-6 shadow-xl border border-neutral-200"
      >
        <h2 className="text-xl font-semibold mb-2">Ouder-toegang</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Voer de pincode in om de ouder-module te openen.
        </p>

        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="pincode"
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 mb-3"
          autoFocus
        />

        {err && <div className="text-red-600 text-sm mb-3">{err}</div>}

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={logout}
            className="px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50"
          >
            Uitloggen
          </button>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl border border-blue-500 bg-blue-50 hover:bg-blue-100"
          >
            Ontgrendel
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- hoofdcomponent ---------- */

export default function WeekschemaApp() {
  const { users: fsUsers } = useFirestoreSync() || {};
  const { currentDevice } = useDeviceBinding() || {};

  const users = fsUsers?.length ? fsUsers : DEMO_USERS;
  const deviceRole = currentDevice?.role || "ouder";

  // modus
  const [mode, setMode] = useState(() => {
    const m = ls.get(LS_MODE_KEY);
    if (m === "parent" || m === "kid") return m;
    return deviceRole === "kind" ? "kid" : "parent";
  });

  // actieve user
  const [activeUserId, setActiveUserId] = useState(() => ls.get(LS_USER_KEY));
  useEffect(() => {
    if (!users.length) return;
    const fixed = pickValidUserId(users, activeUserId, currentDevice?.userId);
    if (fixed && fixed !== activeUserId) {
      setActiveUserId(fixed);
      ls.set(LS_USER_KEY, fixed);
    }
    if (!fixed) ls.del(LS_USER_KEY);
  }, [users, activeUserId, currentDevice?.userId]);

  useEffect(() => { if (activeUserId) ls.set(LS_USER_KEY, activeUserId); }, [activeUserId]);
  useEffect(() => { ls.set(LS_MODE_KEY, mode); }, [mode]);

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) || users[0] || null,
    [users, activeUserId]
  );

  // ouder-navigatie + highlight
  const [parentView, setParentView] = useState("home");
  const [lastOpenedView, setLastOpenedView] = useState(null);

  // dagstatistiek kids
  const [dayStats, setDayStats] = useState({ completed: 0, total: 0 });

  // PIN-gate: alleen in parent-modus nodig
  const pinRequired = deviceRole === "ouder" && mode === "parent" && ls.get(LS_PIN_OK) !== "1";

  // acties
  const openChildFromParent = (kidId) => {
    setActiveUserId(kidId);
    setMode("kid");
  };

  const goBackToParent = () => {
    setMode("parent");
    setParentView("home");
  };

  const canGoBack = deviceRole === "ouder" && mode === "kid";

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Demo-badge */}
      {(deviceRole === "ouder" && mode === "parent" && (!fsUsers || fsUsers.length === 0)) && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
          Demo-modus: Firestore leeg/niet geladen — toon voorbeeldgebruikers.
        </div>
      )}

      {/* ---------- OUDER ---------- */}
      {deviceRole === "ouder" && mode === "parent" && (
        <>
          {/* één ouder-header */}
          <Header_Parent
            users={users}
            activeUserId={activeUser?.id}
            onFocusUser={setActiveUserId}
            onOpenChild={openChildFromParent}
          />

          {/* PIN-gate */}
          <PinGate
            required={pinRequired}
            onUnlock={() => { /* opnieuw renderen */ }}
          />

          {/* menu of panelen */}
          {parentView === "home" ? (
            <div className="mt-4">
              <ParentHome
                activeView={lastOpenedView}
                onOpen={(v) => { setParentView(v); setLastOpenedView(v); }}
              />
            </div>
          ) : (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setParentView("home")}
                className="mb-3 px-3 py-2 rounded-xl border border-neutral-200 bg-white/80 hover:bg-white shadow-sm"
              >
                ← Terug naar overzicht
              </button>

              {parentView === "weekschedule" && (
                <WeekSchedulePanel userId={activeUser?.id} users={users} />
              )}
              {parentView === "blocks" && (
                <BlocksPanel userId={activeUser?.id} users={users} />
              )}
              {parentView === "users" && <UsersPanel users={users} />}
              {parentView === "devices" && <DevicesPanel />}
              {parentView === "library" && <LibraryPanel />}
            </div>
          )}
        </>
      )}

      {/* ---------- KIND ---------- */}
      {(deviceRole === "kind" || (deviceRole === "ouder" && mode === "kid")) && (
        <>
          <Header_Kids user={activeUser} canGoBack={canGoBack} onBack={goBackToParent} />

          <KidsDaySummary
            date={new Date()}
            completed={dayStats.completed}
            total={dayStats.total}
          />

          <KidsBlocks
            userId={activeUser?.id}
            userKey={(activeUser?.id || activeUser?.name || "").toLowerCase()}
            library={TASK_LIBRARY}
            assignments={
              ASSIGNMENTS[(activeUser?.id || activeUser?.name || "").toLowerCase()] || []
            }
            displayMode={(activeUser?.name || "").toLowerCase() === "lina" ? "picto" : "text"}
            onStatsChange={setDayStats}
          />
        </>
      )}
    </div>
  );
}
