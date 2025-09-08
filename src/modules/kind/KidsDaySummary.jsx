import React from "react";

/**
 * KidsDaySummary
 * Props:
 *  - date: Date
 *  - completed: number
 *  - total: number
 */
export default function KidsDaySummary({ date = new Date(), completed = 0, total = 0 }) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  const weekday = new Intl.DateTimeFormat("nl-BE", { weekday: "long" }).format(date); // maandag, ...
  const month   = new Intl.DateTimeFormat("nl-BE", { month: "long" }).format(date);  // september
  const day     = new Intl.DateTimeFormat("nl-BE", { day: "2-digit" }).format(date).replace(/^0/, "");

  const icon = weekdayIcon(weekday);

  return (
    <section
      style={{
        position: "relative",
        border: "1px solid rgb(229,231,235)",
        borderRadius: 16,
        padding: 16,
        background: "rgba(255,255,255,.8)",
        marginBottom: 8,
      }}
    >
      {/* label bovenop */}
      <div
        style={{
          position: "absolute",
          top: -12,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "2px 10px",
          fontWeight: 700,
          fontSize: 15,
          background: "white",
          border: "1px solid rgb(229,231,235)",
          borderRadius: 9999,
        }}
      >
        Mijn dag
      </div>

      {/* inhoud */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {/* icoon + datum */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              display: "grid", placeItems: "center",
              background: "rgb(243,244,246)",
              border: "1px solid rgb(229,231,235)",
              fontSize: 22,
            }}
            aria-hidden
          >
            {icon}
          </div>

          {/* zondag 7 september */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 16, color: "rgb(64,64,64)" }}>{weekday.toLowerCase()}</span>
            <span style={{ fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{day}</span>
            <span style={{ fontSize: 16, color: "rgb(64,64,64)" }}>{month.toLowerCase()}</span>
          </div>
        </div>

        {/* teller + progress */}
        <div style={{ flex: "1 1 260px", minWidth: 260 }}>
          <div style={{ fontSize: 14, color: "rgb(64,64,64)", marginBottom: 6 }}>
            Afgevinkt: <strong>{completed}</strong> / {total} taken
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            style={{
              width: "100%", height: 10, borderRadius: 9999,
              background: "rgb(243,244,246)",
              border: "1px solid rgb(229,231,235)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`, height: "100%",
                background: "linear-gradient(90deg, #60a5fa, #3b82f6)",
                transition: "width .2s ease",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function weekdayIcon(weekdayNl) {
  const w = (weekdayNl || "").toLowerCase();
  if (w.includes("maandag"))   return "🌙";        // maan
  if (w.includes("dinsdag"))   return "🦖";        // dino
  if (w.includes("woensdag"))  return "🐶";        // hond
  if (w.includes("donderdag")) return "⛈️";       // donder
  if (w.includes("vrijdag"))   return "🧑‍🤝‍🧑";   // vrienden
  if (w.includes("zaterdag"))  return "🪚";        // zaag
  if (w.includes("zondag"))    return "☀️";        // zon
  return "📅";
}
