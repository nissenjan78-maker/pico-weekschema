import React, { useEffect, useMemo, useState } from "react";

/* Zelfde helpers als in het weekschema */
const DAY_IDS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const BLOCKS = [
  { id: "morning", label: "Ochtend", time: "07:00–08:15" },
  { id: "noon", label: "Middag", time: "12:00–13:30" },
  { id: "evening", label: "Avond", time: "18:30–20:30" },
];

function mondayOf(date) {
  const d = new Date(date);
  const wd = d.getDay();
  const diff = wd === 0 ? -6 : 1 - wd;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function ymd(date) {
  const d = new Date(date);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* Keys voor planning vs. afvink-status */
function lskAssignments(userId, mondayStr) {
  return `weekschema.assignments.${(userId || "unknown").toLowerCase()}.${mondayStr}`;
}
function lskChecks(userId, dayStr) {
  return `weekschema.checks.${(userId || "unknown").toLowerCase()}.${dayStr}`;
}

function loadAssignments(userId, mondayStr) {
  try {
    const raw =
      localStorage.getItem(lskAssignments(userId, mondayStr)) ||
      "{}";
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function loadChecks(userId, dayStr) {
  try {
    const raw = localStorage.getItem(lskChecks(userId, dayStr)) || "{}";
    const obj = JSON.parse(raw);
    return {
      morning: new Set(obj.morning || []),
      noon: new Set(obj.noon || []),
      evening: new Set(obj.evening || []),
    };
  } catch {
    return { morning: new Set(), noon: new Set(), evening: new Set() };
  }
}
function saveChecks(userId, dayStr, checks) {
  const toStore = {
    morning: Array.from(checks.morning),
    noon: Array.from(checks.noon),
    evening: Array.from(checks.evening),
  };
  localStorage.setItem(lskChecks(userId, dayStr), JSON.stringify(toStore));
}

export default function KidsBlocks({ userId, library = [], onStatsChange }) {
  const today = new Date();
  const todayStr = ymd(today);
  const weekMonday = mondayOf(today);
  const weekKey = ymd(weekMonday);

  const [assignments, setAssignments] = useState(() =>
    loadAssignments(userId, weekKey)
  );
  const [checks, setChecks] = useState(() => loadChecks(userId, todayStr));

  // luister naar wijzigingen in localStorage (bv. weekschema gewijzigd in ouderview)
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key.startsWith("weekschema.assignments.")) {
        setAssignments(loadAssignments(userId, weekKey));
      }
      if (e.key === lskChecks(userId, todayStr)) {
        setChecks(loadChecks(userId, todayStr));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId, weekKey, todayStr]);

  useEffect(() => {
    setAssignments(loadAssignments(userId, weekKey));
  }, [userId, weekKey]);

  useEffect(() => {
    setChecks(loadChecks(userId, todayStr));
  }, [userId, todayStr]);

  // Bepaal dayId van vandaag
  const dayIndex = (today.getDay() + 6) % 7; // ma=0 ... zo=6
  const dayId = DAY_IDS[dayIndex];

  // Resolve ids → taken met (name, picto)
  const byId = useMemo(() => new Map(library.map((t) => [t.id, t])), [library]);

  const blocksForToday = useMemo(() => {
    const res = {};
    for (const b of BLOCKS) {
      const key = `${dayId}.${b.id}`;
      const items = (assignments[key] || [])
        .map((it) => byId.get(it.id))
        .filter(Boolean);
      res[b.id] = items;
    }
    return res;
  }, [assignments, byId, dayId]);

  // Stats (afgevinkt / totaal)
  useEffect(() => {
    if (!onStatsChange) return;
    const total =
      (blocksForToday.morning?.length || 0) +
      (blocksForToday.noon?.length || 0) +
      (blocksForToday.evening?.length || 0);
    const completed =
      (blocksForToday.morning || []).filter((t) => checks.morning.has(t.id))
        .length +
      (blocksForToday.noon || []).filter((t) => checks.noon.has(t.id)).length +
      (blocksForToday.evening || []).filter((t) => checks.evening.has(t.id))
        .length;

    onStatsChange({ completed, total });
  }, [blocksForToday, checks, onStatsChange]);

  // Toggle “gedaan”
  const toggleTask = (blockId, taskId) => {
    setChecks((prev) => {
      const copy = {
        morning: new Set(prev.morning),
        noon: new Set(prev.noon),
        evening: new Set(prev.evening),
      };
      const set = copy[blockId];
      if (set.has(taskId)) set.delete(taskId);
      else set.add(taskId);
      saveChecks(userId, todayStr, copy);
      return copy;
    });
  };

  /* ─────────── styles ─────────── */
  // 4×4 cm tegels, smalle ruimte ertussen, wrapt automatisch naar volgende rij
  const gridStyle = {
    display: "flex",
    gap: "0.3cm",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginTop: 10,
  };
  const tileStyle = (done) => ({
    width: "4cm",
    height: "4cm",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    transition: "filter 120ms ease, opacity 120ms ease",
    filter: done ? "grayscale(1)" : "none",
    opacity: done ? 0.5 : 1,
  });
  const pictoStyle = {
    width: "3.2cm",
    height: "3.2cm",
    objectFit: "contain",
    borderRadius: 10,
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {BLOCKS.map((b) => {
        const items = blocksForToday[b.id] || [];
        const doneSet = checks[b.id];

        return (
          <div
            key={b.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "12px 14px",
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{b.label}</div>
              <div style={{ color: "#6b7280" }}>{b.time}</div>
            </div>

            {items.length === 0 ? (
              <div style={{ marginTop: 8, color: "#9ca3af" }}>Geen taken</div>
            ) : (
              <div style={gridStyle}>
                {items.map((t) => {
                  const done = doneSet.has(t.id);
                  const src =
                    t.picto && (t.picto.startsWith("/") ? t.picto : `/pictos/${t.picto}`);
                  return (
                    <div
                      key={t.id}
                      style={tileStyle(done)}
                      title={t.name || ""}
                      onClick={() => toggleTask(b.id, t.id)}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={t.name || ""}
                          style={pictoStyle}
                          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                        />
                      ) : (
                        <div style={{ color: "#9ca3af" }}>{t.name || "Taak"}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
