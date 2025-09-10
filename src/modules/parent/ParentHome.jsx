// src/modules/parent/ParentHome.jsx
import React, { useEffect, useCallback } from "react";

/**
 * Compact ouder-menu (tegels, met eigen scoped CSS)
 * Props:
 *  - onOpen(viewId): 'weekschedule'|'dayplan'|'users'|'devices'|'library'
 *  - activeView: id van de geopende pagina (legt ring)
 *  - title?: label boven de tegels (default: "Menu")
 */
export default function ParentHome({ onOpen, activeView, title = "Menu" }) {
  const tiles = [
    { id: "weekschedule", title: "Weekschema", icon: "📅" },
    { id: "dayplan",      title: "Dagindeling", icon: "⏱️" },
    { id: "users",        title: "Gebruikers",   icon: "👨‍👩‍👧‍👦" },
    { id: "devices",      title: "Devices",      icon: "💻" },
    { id: "library",      title: "Bibliotheek",  icon: "📚" },
  ];

  // Sneltoetsen 1..5 om tegels te openen
  const onKey = useCallback((e) => {
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1 || n > tiles.length) return;
    const t = tiles[n - 1];
    onOpen?.(t.id);
  }, [onOpen]);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <div className="ph-card">
      <div className="ph-headbar ph-headbar--inline">
        <span className="ph-chip">{title}</span>
       <span className="ph-tip-inline">
  Tip: gebruik&nbsp;<b>1–5</b> &nbsp;om snel te openen · pijltjestoetsen om te navigeren
</span>
      </div>

      <div className="ph-tiles">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            className={[
              "ph-tile",
              activeView === t.id ? "ph-tile--active" : "",
            ].join(" ")}
            onClick={() => onOpen?.(t.id)}
          >
            <div className="ph-tile-icon" aria-hidden="true">{t.icon}</div>
            <div className="ph-tile-title">{t.title}</div>
          </button>
        ))}
      </div>

      {/* Scoped CSS */}
   <style>{`
  .ph-card{ margin-top:6px; padding-block: 12px; }

  .ph-headbar{
    display:flex; gap:12px; margin-bottom:10px;

    /* >>> nieuw: ook hier baselines uitlijnen */
    align-items: baseline;
  }

  /* Menu-lijn: label + tip op 1 lijn, zonder afbreken */
.ph-headbar--inline{
  justify-content:flex-start;
  flex-wrap: nowrap;
  white-space: nowrap;

  /* was: overflow:auto;  -> maak het puur horizontaal en verberg verticaal */
  overflow-x: auto;
  overflow-y: hidden;

  scrollbar-width: none;               /* Firefox */
  margin-top: 2px;
}
.ph-headbar--inline::-webkit-scrollbar{ display:none; }    /* WebKit */


  .ph-chip{
    display:inline-block; padding:4px 10px; border-radius:999px;
    border:1px solid var(--ph-border, #e5e7eb); background:#fff; font-weight:700;
    white-space:nowrap;

    /* >>> nieuw: dezelfde micro-offset als bij Admin */
    position: relative;
    top: 3px;
    line-height: 1;
  }

  .ph-tip-inline{ color:#6b7280; font-size:14px; white-space:nowrap; }

  /* Tegels passend + gecentreerd in de kaart */
  .ph-tiles{
    display:grid !important;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap:14px;
    max-width: 1100px;
    margin-inline: auto;
    align-items: stretch;
    justify-items: stretch;
  }
  .ph-tile{
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:8px;
    text-align:center;
    padding:12px 14px;
    border:1px solid var(--ph-border, #e5e7eb);
    background:#fff;
    border-radius:16px;
    transition:transform .06s ease, box-shadow .06s ease, border-color .06s ease, background .06s ease;
    min-height: 112px;
  }
  .ph-tile:hover{ transform: translateY(-1px); background:#fff; }
  .ph-tile--active{ outline:2px solid #60a5fa; outline-offset:2px; }

  .ph-tile-icon{
    width:40px; height:40px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    background:#f3f4f6; font-size:20px;
  }
  .ph-tile-title{ font-weight:700; }
`}</style>


    </div>
  );
}
