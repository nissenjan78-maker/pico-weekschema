// src/WeekschemaApp.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import SectionCard from "./modules/common/SectionCard";
import WeekSchedulePanel from "./modules/parent/panels/WeekSchedulePanel";

import {
  fetchTenantUsers,
  fetchDayplanMap,
  fetchLibrary,
} from "./lib/tenantApi";

// ---- DEMO MENU ----
const MENU_TILES = [
  { id: "weekschedule", title: "Weekschema", icon: "📅" },
  { id: "dayplan",      title: "Dagindeling", icon: "⏱️" },
  { id: "users",        title: "Gebruikers",  icon: "👨‍👩‍👧‍👦" },
  { id: "devices",      title: "Devices",     icon: "💻" },
  { id: "library",      title: "Bibliotheek", icon: "🗂️" },
];

export default function WeekschemaApp() {
  const famId = "Niss01";                // <- jouw tenant/famId
  const isFirestoreReady = true;         // voor meta weergave

  const [users, setUsers] = useState([]);
  const [dayplanMap, setDayplanMap] = useState({});
  const [library, setLibrary] = useState([]);

  const [view, setView] = useState("home");

  useEffect(() => {
    (async () => {
      try {
        const [u, dp, lib] = await Promise.all([
          fetchTenantUsers(famId),
          fetchDayplanMap(famId),
          fetchLibrary(famId),
        ]);
        setUsers(u);
        setDayplanMap(dp);
        setLibrary(lib.length ? lib : [
          { id: "aankleden", label: "Aankleden", icon: "/pictos/Aankleden.png" },
        ]);
      } catch (e) {
        console.error("fetch init", e);
      }
    })();
  }, [famId]);

  const fsStatus = isFirestoreReady ? "verbonden" : "niet verbonden";
  const famMetaLeft = { label: "FamID", value: famId };
  const famMetaRight = { label: "Firestore", value: fsStatus };

  const openTile = useCallback((id) => setView(id === "weekschedule" ? "weekschedule" : id), []);
  const closePanel = useCallback(() => setView("home"), []);
  const CloseBtn = (<button className="btn" onClick={closePanel}>Sluiten</button>);

  const renderHome = () => (
    <>
      <SectionCard title="Admin" metaLeft={famMetaLeft} metaRight={famMetaRight}>
        {/* Hier staat jouw CompactParentHeader normaal - tijdelijk weg voor eenvoud */}
        <div style={{ color:"#6b7280" }}>Selecteer een onderdeel hieronder.</div>
      </SectionCard>

      <SectionCard title="Menu">
        <div className="tiles">
          {MENU_TILES.map((t) => (
            <button key={t.id} className="tile" onClick={() => openTile(t.id)}>
              <div className="tile-icon" aria-hidden="true"><span style={{ fontSize: 18 }}>{t.icon}</span></div>
              <div className="tile-title">{t.title}</div>
            </button>
          ))}
        </div>
      </SectionCard>
    </>
  );

  const renderWeekSchedule = () => (
    <SectionCard title="Weekschema" right={CloseBtn}>
      <WeekSchedulePanel
        famId={famId}
        users={users}
        dayplanMap={dayplanMap}
        library={library}
      />
    </SectionCard>
  );

  const renderView = () => {
    switch (view) {
      case "home":         return renderHome();
      case "weekschedule": return renderWeekSchedule();
      default:             return renderHome();
    }
  };

  return (
    <div className="wrap">
      {renderView()}

      <style>{`
        :root { --border: #e5e7eb; }
        .wrap{ max-width: 1200px; margin-inline:auto; padding:16px; display:grid; gap:16px; }

        .tiles{
          display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
          gap: 14px; max-width: 1100px; margin-inline:auto;
        }
        .tile{
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap: 8px; text-align:center; min-height:112px; border:1px solid var(--border);
          background:#fff; border-radius:16px; padding: 12px 14px; transition: transform .06s ease;
        }
        .tile:hover{ transform:translateY(-1px); }
        .tile-icon{ width:40px; height:40px; border-radius:12px; background:#f3f4f6; display:flex; align-items:center; justify-content:center; }
        .tile-title{ font-weight:700; }
        .btn{ padding:6px 10px; border:1px solid var(--border); background:#fff; border-radius:10px; font-weight:600; cursor:pointer; }
      `}</style>
    </div>
  );
}
