import React, { useEffect, useMemo, useState } from "react";

/**
 * Ouder-module → Blokken beheren (pure styles, geen Tailwind)
 * Per kind een kaart met:
 *  - gecentreerde datum "Datum: …"
 *  - Avatar – Naam – Rol (1 lijn, vaste hoogte)
 *  - Schooldag (checkbox)
 *  - Opstaan – Slapen
 *  - School/Middag Begin – Einde
 * Auto-save naar localStorage.
 */

export default function BlocksPanel({ users = [] }) {
  const kids = useMemo(
    () => (users || []).filter((u) => (u.role || "").toLowerCase() === "kind"),
    [users]
  );
  const [dateIso, setDateIso] = useState(() => todayIso());

  const headerRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 8,
  };
  const pill = {
    padding: "6px 10px",
    borderRadius: 12,
    border: "1px solid #d4d4d8",
    background: "rgba(255,255,255,.8)",
  };
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
    gap: 16,
  };

  return (
    <div className="blocks-panel" style={{ display: "grid", gap: 16 }}>
      <style>{`
        /* verberg kalender/klok/spinners alleen in dit panel */
        .blocks-panel input[type="date"]::-webkit-calendar-picker-indicator,
        .blocks-panel input[type="time"]::-webkit-calendar-picker-indicator { display: none; }
        .blocks-panel input[type="time"]::-webkit-inner-spin-button,
        .blocks-panel input[type="time"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .blocks-panel input[type="time"] { -moz-appearance: textfield; }
      `}</style>

      <div style={headerRow}>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Blokken beheren</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 14, color: "#404040" }}>Datum</label>
          <input
            type="date"
            value={dateIso}
            onChange={(e) => setDateIso(e.target.value)}
            style={{ ...pill, padding: "6px 8px", fontSize: 14, outline: "none" }}
          />
        </div>
      </div>

      {kids.length === 0 ? (
        <div style={{ fontSize: 14, color: "#525252" }}>
          Geen kinderen gevonden. Voeg eerst een kind toe bij <b>Gebruikers</b>.
        </div>
      ) : (
        <div style={grid}>
          {kids.map((kid) => (
            <KidCard key={kid.id} kid={kid} dateIso={dateIso} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── Kid-kaart ───────────── */

function KidCard({ kid, dateIso }) {
  const [cfg, setCfg] = useState(() => load(kid.id, dateIso) || defaults(dateIso));
  const [saved, setSaved] = useState(false);

  // stabiele avatar: eigen src-state + once-only fallback
  const initialAvatar = `/avatars/${kid.avatar || "avatar.png"}`;
  const [avatarSrc, setAvatarSrc] = useState(initialAvatar);
  useEffect(() => {
    setAvatarSrc(`/avatars/${kid.avatar || "avatar.png"}`);
  }, [kid.id, kid.avatar]);

  useEffect(() => {
    const fresh = load(kid.id, dateIso) || defaults(dateIso);
    setCfg(fresh);
    setSaved(false);
  }, [kid.id, dateIso]);

  useEffect(() => {
    save(kid.id, dateIso, normalize(cfg));
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 900);
    return () => clearTimeout(t);
  }, [cfg, kid.id, dateIso]);

  const card = {
    position: "relative",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "rgba(255,255,255,.85)",
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,.06)",
  };
  const legend = {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "2px 10px",
    borderRadius: 9999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 700,
    fontSize: 15,
    whiteSpace: "nowrap",
  };

  // Avatar – Naam – Rol op 1 lijn, vaste hoogte
  const topRow = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    marginBottom: 10,
  };
  const avatarStyle = {
    width: 56,
    height: 56,
    borderRadius: 12,
    objectFit: "cover",
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    flex: "0 0 56px",
  };
  const textCol = { display: "flex", flexDirection: "column", lineHeight: 1.15, flex: 1 };

  const row = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
  const input = {
    padding: "6px 10px",
    borderRadius: 12,
    border: "1px solid #d4d4d8",
    background: "rgba(255,255,255,.9)",
    outline: "none",
    fontSize: 14,
  };
  const dividerDot = <span style={{ opacity: 0.5, margin: "0 4px" }}>–</span>;

  const topLabel = `Datum: ${fmt(dateIso)}`;
  const midLabel = cfg.isSchoolDay ? "School" : "Middag";

  return (
    <section style={card}>
      <div style={legend}>{topLabel}</div>

      {/* Avatar – Naam – Rol */}
      <div style={topRow}>
        <img
          src={avatarSrc}
          alt={kid.name}
          style={avatarStyle}
          onError={(e) => {
            if (e.currentTarget.dataset.fallback !== "1") {
              e.currentTarget.dataset.fallback = "1";
              setAvatarSrc("/avatars/avatar.png");
            }
          }}
          loading="eager"
          draggable={false}
        />
        <div style={textCol}>
          <span style={{ fontWeight: 700 }}>{kid.name}</span>
          <span style={{ fontSize: 13, color: "#6b7280", textTransform: "capitalize" }}>
            {kid.role}
          </span>
        </div>
        {saved && (
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 9999,
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
              whiteSpace: "nowrap",
            }}
          >
            Opgeslagen ✓
          </span>
        )}
      </div>

      {/* Schooldag */}
      <div style={{ ...row, marginBottom: 6 }}>
        <input
          id={`school-${kid.id}`}
          type="checkbox"
          checked={cfg.isSchoolDay}
          onChange={(e) =>
            setCfg((c) => ({
              ...c,
              isSchoolDay: e.target.checked,
              schoolStart: e.target.checked ? c.schoolStart || "08:30" : c.schoolStart,
              schoolEnd: e.target.checked ? c.schoolEnd || "15:30" : c.schoolEnd,
            }))
          }
        />
        <label htmlFor={`school-${kid.id}`} style={{ fontWeight: 600 }}>
          Schooldag
        </label>
      </div>

      {/* Opstaan – Slapen */}
      <div style={{ ...row, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Opstaan:</span>
        <input
          type="time"
          value={cfg.wake}
          onChange={(e) => setCfg((c) => ({ ...c, wake: e.target.value }))}
          style={input}
          step={300}
        />
        {dividerDot}
        <span style={{ fontSize: 14, fontWeight: 600 }}>Slapen:</span>
        <input
          type="time"
          value={cfg.sleep}
          onChange={(e) => setCfg((c) => ({ ...c, sleep: e.target.value }))}
          style={input}
          step={300}
        />
      </div>

      {/* School/Middag Begin – Einde */}
      <div style={{ ...row }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{midLabel} Begin:</span>
        <input
          type="time"
          value={cfg.isSchoolDay ? (cfg.schoolStart || "08:30") : (cfg.noonFrom || "12:00")}
          onChange={(e) =>
            setCfg((c) =>
              c.isSchoolDay ? { ...c, schoolStart: e.target.value } : { ...c, noonFrom: e.target.value }
            )
          }
          style={input}
          step={300}
        />
        {dividerDot}
        <span style={{ fontSize: 14, fontWeight: 600 }}>Einde:</span>
        <input
          type="time"
          value={cfg.isSchoolDay ? (cfg.schoolEnd || "15:30") : (cfg.noonTo || "13:30")}
          onChange={(e) =>
            setCfg((c) =>
              c.isSchoolDay ? { ...c, schoolEnd: e.target.value } : { ...c, noonTo: e.target.value }
            )
          }
          style={input}
          step={300}
        />
      </div>

      <div style={{ height: 6 }} />
    </section>
  );
}

/* ───────────── Opslag & helpers ───────────── */

function key(userId, dateIso) {
  return `weekschema.day.${userId || "unknown"}.${dateIso}`;
}
function load(userId, dateIso) {
  try {
    const raw = localStorage.getItem(key(userId, dateIso));
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
function save(userId, dateIso, cfg) {
  try {
    localStorage.setItem(key(userId, dateIso), JSON.stringify(cfg));
  } catch {}
}

function defaults(dateIso) {
  return {
    date: dateIso,
    isSchoolDay: false,
    wake: "07:00",
    sleep: "20:30",
    noonFrom: "12:00",
    noonTo: "13:30",
    schoolStart: "08:30",
    schoolEnd: "15:30",
  };
}
function normalize(c) {
  const cfg = { ...(c || {}) };
  cfg.date = cfg.date || todayIso();
  cfg.wake = cfg.wake || "07:00";
  cfg.sleep = cfg.sleep || "20:30";
  if (cfg.isSchoolDay) {
    cfg.schoolStart = cfg.schoolStart || "08:30";
    cfg.schoolEnd = cfg.schoolEnd || "15:30";
  } else {
    cfg.noonFrom = cfg.noonFrom || "12:00";
    cfg.noonTo = cfg.noonTo || "13:30";
  }
  return cfg;
}

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}
function fmt(iso) {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = new Intl.DateTimeFormat("nl-BE", { weekday: "long" }).format(date);
    const month = new Intl.DateTimeFormat("nl-BE", { month: "long" }).format(date);
    const day = new Intl.DateTimeFormat("nl-BE", { day: "2-digit" }).format(date).replace(/^0/, "");
    return `${weekday} ${day} ${month}`;
  } catch {
    return iso;
  }
}
