import React from "react";

/**
 * Ouder-menu (chip + tegels)
 * Props:
 *  - onOpen(viewId): 'weekschedule'|'blocks'|'users'|'devices'|'library'
 *  - activeView: laatst geopende tegel (blauwe ring)
 */
export default function ParentHome({ onOpen, activeView }) {
  const tiles = [
    { id: "weekschedule", title: "Weekschema",       subtitle: "Open weekschema",       icon: "📅" },
    { id: "blocks",       title: "Blokken beheren",  subtitle: "Open blokken beheren",  icon: "⏱️" },
    { id: "users",        title: "Gebruikers",       subtitle: "Open gebruikers",       icon: "👨‍👩‍👧‍👦" },
    { id: "devices",      title: "Devices",          subtitle: "Open devices",          icon: "💻" },
    { id: "library",      title: "Bibliotheek",      subtitle: "Open bibliotheek",      icon: "📚" },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="inline-block px-4 py-1 rounded-full border border-neutral-200 bg-white/80 shadow-sm text-sm font-semibold">
          Ouder-menu
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {tiles.map((t) => (
          <Tile
            key={t.id}
            active={activeView === t.id}
            title={t.title}
            subtitle={t.subtitle}
            icon={t.icon}
            onClick={() => onOpen?.(t.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Tile({ active, title, subtitle, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-2xl border bg-white/80",
        "border-neutral-200 hover:bg-white shadow-sm transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        active ? "ring-2 ring-blue-400" : "",
      ].join(" ")}
    >
      <div className="p-4 flex items-center gap-3">
        <div
          className={[
            "flex items-center justify-center rounded-xl",
            "w-12 h-12 text-xl select-none",
            active ? "bg-blue-50" : "bg-neutral-100",
          ].join(" ")}
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="font-semibold leading-tight">{title}</div>
          <div className="text-sm text-neutral-500">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}
