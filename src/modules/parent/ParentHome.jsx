// src/modules/parent/ParentHome.jsx
import React, { useEffect, useMemo, useRef, useCallback } from "react";

/**
 * Ouder-menu (kaart met tegels)
 * Props:
 *  - onOpen(viewId): 'weekschedule'|'blocks'|'users'|'devices'|'library'
 *  - activeView: string
 *  - title?: string (default "Menu")
 */
export default function ParentHome({ onOpen, activeView, title = "Menu" }) {
  const tiles = useMemo(
    () => [
      { id: "weekschedule", title: "Weekschema",       icon: "📅" },
      { id: "blocks",       title: "Blokken beheren",  icon: "⏱️" },
      { id: "users",        title: "Gebruikers",       icon: "👨‍👩‍👧‍👦" },
      { id: "devices",      title: "Devices",          icon: "💻" },
      { id: "library",      title: "Bibliotheek",      icon: "📚" },
    ],
    []
  );

  const btnRefs = useRef([]);

  const handleOpen = useCallback((id) => {
    if (typeof onOpen === "function") onOpen(id);
  }, [onOpen]);

  // Hotkeys 1–9
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= tiles.length) {
        e.preventDefault();
        const idx = n - 1;
        handleOpen(tiles[idx].id);
        btnRefs.current[idx]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tiles, handleOpen]);

  // Pijltjestoetsen in grid
  const onTileKeyDown = useCallback((e, idx) => {
    const width = window.innerWidth;
    const cols = width >= 1280 ? 5 : width >= 768 ? 3 : width >= 640 ? 2 : 1;
    const go = (i) => btnRefs.current[i]?.focus();

    switch (e.key) {
      case "ArrowRight": e.preventDefault(); go(Math.min(idx + 1, tiles.length - 1)); break;
      case "ArrowLeft":  e.preventDefault(); go(Math.max(idx - 1, 0)); break;
      case "ArrowDown":  e.preventDefault(); go(Math.min(idx + cols, tiles.length - 1)); break;
      case "ArrowUp":    e.preventDefault(); go(Math.max(idx - cols, 0)); break;
      case "Enter":
      case " ":
        e.preventDefault(); handleOpen(tiles[idx].id); break;
      default: break;
    }
  }, [tiles, handleOpen]);

  return (
    <div className="ph-card">
      {/* Headbar: label + tip op één lijn (CSS zorgt dat dit niet wrapt) */}
      <div className="ph-headbar">
        <span className="ph-chip">{title}</span>
        <span className="ph-tip-inline">
          Tip: gebruik 1–{tiles.length} om snel te openen · pijltjestoetsen om te navigeren
        </span>
      </div>

      {/* Inhoud (tegels hoog onder de headbar) */}
      <div className="ph-card-body ph-card-body--tight ph-card-body--no-topgap">
        <div className="ph-grid" role="grid" aria-label="Menu opties">
          {tiles.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => (btnRefs.current[i] = el)}
              type="button"
              className={`ph-tile ${activeView === t.id ? "is-active" : ""}`}
              role="gridcell"
              aria-selected={activeView === t.id ? "true" : "false"}
              aria-label={`${t.title} (${i + 1})`}
              onClick={() => handleOpen(t.id)}
              onKeyDown={(e) => onTileKeyDown(e, i)}
            >
              <div className="ph-tile-icon" aria-hidden>
                <span className="ph-emoji">{t.icon}</span>
              </div>
              <div className="min-w-0 ph-tile-text">
                <div className="ph-tile-title">{t.title}</div>
                {/* Geen ondertitel “Open …” meer */}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
