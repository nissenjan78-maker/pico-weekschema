// src/modules/parent/panels/WeekSchedulePanel.jsx
import React, { useMemo, useState, useEffect } from "react";
import { TASK_LIBRARY } from "../../../data/taskLibrary";

/* ────────────────────────────────────────────────────────────
   Kleine helpers – geen externe date-fns dependency nodig
   ──────────────────────────────────────────────────────────── */
const DAY_IDS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const DAY_LABELS = { ma: "ma", di: "di", wo: "wo", do: "do", vr: "vr", za: "za", zo: "zo" };
const BLOCKS = [
  { id: "morning", label: "Ochtend", time: "07:00–08:15" },
  { id: "midday",  label: "Middag",  time: "12:00–13:30" },
  { id: "evening", label: "Avond",   time: "18:30–20:30" },
];

function startOfWeekMonday(d) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();           // 0 = zo, 1 = ma, ...
  const diff = (day + 6) % 7;          // maandag = 0
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function fmtISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/* ────────────────────────────────────────────────────────────
   Opslag helpers – per kind én per week (maandag ISO)
   assignments:
   {
     "ma": { morning: [taskId,...], midday: [...], evening: [...] },
     "di": {...}, ...
   }
   ──────────────────────────────────────────────────────────── */
function storageKey(userId, mondayISO) {
  return `weekschema.assignments.${userId}.${mondayISO}`;
}
function loadAssignments(userId, mondayISO) {
  try {
    const raw = localStorage.getItem(storageKey(userId, mondayISO));
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}
function saveAssignments(userId, mondayISO, data) {
  localStorage.setItem(storageKey(userId, mondayISO), JSON.stringify(data));
}

/* ────────────────────────────────────────────────────────────
   Snelle lookup map voor TASK_LIBRARY
   ──────────────────────────────────────────────────────────── */
const LIB_BY_ID = (() => {
  const map = {};
  (TASK_LIBRARY || []).forEach((t) => (map[t.id] = t));
  return map;
})();

/* ────────────────────────────────────────────────────────────
   Component
   props:
     - users: [{ id, name, role, avatar }, ...]
     - userId?: vooraf geselecteerd kind
   ──────────────────────────────────────────────────────────── */
export default function WeekSchedulePanel({ users = [], userId }) {
  // start met gekozen kind of eerste kind of eerste user of 'leon'
  const defaultUserId =
    userId ||
    (users.find((u) => u.role === "kind")?.id ||
      users[0]?.id ||
      "leon");

  const [selectedUserId, setSelectedUserId] = useState(defaultUserId);

  // huidige week (vanaf maandag)
  const [monday, setMonday] = useState(() => startOfWeekMonday(new Date()));
  const mondayISO = useMemo(() => fmtISO(monday), [monday]);

  // taken-indeling voor deze user + week
  const [assignments, setAssignments] = useState({});
  useEffect(() => {
    setAssignments(loadAssignments(selectedUserId, mondayISO));
  }, [selectedUserId, mondayISO]);

  useEffect(() => {
    saveAssignments(selectedUserId, mondayISO, assignments);
  }, [selectedUserId, mondayISO, assignments]);

  // bibliotheek filter
  const [search, setSearch] = useState("");
  const [onlySchool, setOnlySchool] = useState(false);

  const filteredLibrary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (TASK_LIBRARY || []).filter((t) => {
      if (onlySchool && !(t.tags || []).includes("school")) return false;
      if (!q) return true;
      const hay = `${t.id} ${t.name || ""} ${(t.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [search, onlySchool]);

  // add / remove in rooster
  const addTask = (dayId, blockId, taskId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      const day = next[dayId] || {};
      const arr = day[blockId] ? [...day[blockId]] : [];
      arr.push(taskId);
      day[blockId] = arr;
      next[dayId] = day;
      return next;
    });
  };
  const removeTask = (dayId, blockId, index) => {
    setAssignments((prev) => {
      const next = { ...prev };
      const day = next[dayId] || {};
      const arr = (day[blockId] || []).slice(0);
      arr.splice(index, 1);
      day[blockId] = arr;
      next[dayId] = day;
      return next;
    });
  };

  // DnD
  const onDragStartTask = (e, taskId) => {
    e.dataTransfer.setData("application/x-task-id", taskId);
    e.dataTransfer.setData("text/plain", taskId); // fallback
  };
  const onDropTask = (e, dayId, blockId) => {
    e.preventDefault();
    const taskId =
      e.dataTransfer.getData("application/x-task-id") ||
      e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    addTask(dayId, blockId, taskId);
  };

  const gotoPrevWeek = () => setMonday((m) => addDays(m, -7));
  const gotoNextWeek = () => setMonday((m) => addDays(m, 7));
  const gotoThisWeek = () => setMonday(startOfWeekMonday(new Date()));

  const kids = users.filter((u) => u.role === "kind");

  return (
    <div className="max-w-6xl mx-auto">
      {/* Terug-knop (optioneel) */}
      <button
        onClick={() => window.history.back()}
        className="px-3 py-2 rounded-xl border border-neutral-200 bg-white/80 hover:bg-white shadow-sm mb-3"
      >
        ← Terug naar overzicht
      </button>

      {/* Kind-selectie */}
      {kids.length > 0 && (
        <div className="mb-4">
          <div className="text-lg font-semibold mb-2">Rooster voor:</div>
          <div className="flex gap-3">
            {kids.map((k) => {
              const isActive = k.id === selectedUserId;
              const avSrc = k.avatar?.startsWith("/") ? k.avatar : `/avatars/${k.avatar || ""}`;
              return (
                <button
                  key={k.id}
                  onClick={() => setSelectedUserId(k.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    isActive ? "border-blue-400 ring-2 ring-blue-200" : "border-neutral-200"
                  } bg-white hover:bg-neutral-50`}
                >
                  {avSrc ? (
                    <img
                      src={avSrc}
                      alt={k.name}
                      style={{ width: 28, height: 28, borderRadius: 999, objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: "#e5e7eb" }} />
                  )}
                  <span className="font-medium">{k.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Titel + weeknavigatie */}
      <h2 className="text-3xl font-bold mb-1">Weekschema</h2>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={gotoPrevWeek}
          className="px-3 py-2 rounded-xl border border-neutral-200 bg-white/80 hover:bg-white shadow-sm"
        >
          ← Vorige week
        </button>
        <button
          onClick={gotoThisWeek}
          className="px-3 py-2 rounded-xl border border-neutral-200 bg-white/80 hover:bg-white shadow-sm"
        >
          Vandaag
        </button>
        <button
          onClick={gotoNextWeek}
          className="px-3 py-2 rounded-xl border border-neutral-200 bg-white/80 hover:bg-white shadow-sm"
        >
          Volgende week →
        </button>
      </div>

      {/* === 2-koloms layout: bibliotheek links, rooster rechts === */}
      <section className="ws-layout">

        {/* ───── LINKERKOLOM: BIBLIOTHEEK ───── */}
        <aside className="ws-left">
          <div className="ws-left-header">
            <h3 className="text-xl font-semibold mb-3">Bibliotheek</h3>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoeken op naam of id…"
              className="px-3 py-2 rounded-xl border border-neutral-300 w-full"
            />

            <label className="inline-flex items-center gap-2 mt-3 select-none">
              <input
                type="checkbox"
                checked={onlySchool}
                onChange={(e) => setOnlySchool(e.target.checked)}
              />
              <span>Alleen ‘school’-taken</span>
            </label>
          </div>

          <div className="ws-left-scroll">
            {(filteredLibrary || []).map((t) => {
              const src = t.picto && (t.picto.startsWith("/") ? t.picto : `/pictos/${t.picto}`);
              return (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => onDragStartTask(e, t.id)}
                  className="ws-lib-item"
                  title={t.name || t.id}
                >
                  {src ? (
                    <img className="ws-lib-picto" src={src} alt={t.name || ""} />
                  ) : (
                    <div className="ws-lib-picto" />
                  )}
                  <div>
                    <div className="ws-lib-title">{t.name || t.id}</div>
                    {t.tags?.length ? (
                      <div className="ws-lib-sub">{t.tags.join(" • ")}</div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {filteredLibrary.length === 0 && (
              <div className="text-neutral-500">Geen taken gevonden.</div>
            )}
          </div>
        </aside>

        {/* ───── RECHTERKOLOM: ROOSTER ───── */}
        <main className="ws-right">
          {/* dagkoppen */}
          <div className="grid grid-cols-7 gap-3 mb-2">
            {DAY_IDS.map((d, i) => {
              const date = addDays(monday, i);
              const show = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
                date.getDate()
              ).padStart(2, "0")}`;
              return (
                <div key={d} className="text-center text-sm font-semibold text-neutral-700">
                  <div className="text-base">{DAY_LABELS[d]}</div>
                  <div className="text-neutral-500">{show}</div>
                </div>
              );
            })}
          </div>

          {/* 3 blokken-rijen */}
          {BLOCKS.map((b) => (
            <div key={b.id} className="mb-5">
              <div className="text-sm font-semibold mb-1">
                {b.label} <span className="text-neutral-500">— {b.time}</span>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {DAY_IDS.map((d) => {
                  const items = assignments?.[d]?.[b.id] || [];
                  return (
                    <div
                      key={`${d}-${b.id}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDropTask(e, d, b.id)}
                      className="min-h-[120px] rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-2"
                    >
                      {/* geplaatste taken */}
                      <div className="flex flex-wrap gap-2">
                        {items.map((tid, idx) => {
                          const t = LIB_BY_ID[tid];
                          const src = t?.picto && (t.picto.startsWith("/") ? t.picto : `/pictos/${t.picto}`);
                          return (
                            <div key={`${tid}-${idx}`} className="relative" title={t?.name || tid}>
                              <div
                                className="w-[64px] h-[64px] rounded-xl bg-white shadow-sm border border-neutral-200 flex items-center justify-center"
                                style={{ padding: 4 }}
                              >
                                {src ? (
                                  <img
                                    src={src}
                                    alt={t?.name || ""}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "contain",
                                      borderRadius: 10,
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-lg bg-neutral-200" />
                                )}
                              </div>
                              <button
                                onClick={() => removeTask(d, b.id, idx)}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                                title="Verwijderen"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* hint */}
                      <div className="text-xs text-neutral-400 mt-2 text-center">
                        Sleep hier taken
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      </section>
    </div>
  );
}
