// src/modules/parent/panels/WeekSchedulePanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  subscribeSchedule,
  addScheduleItem,
  removeScheduleItem,
} from "../../../lib/tenantApi";

/* ---------- helpers ---------- */
const dfmt = (d) => d.toISOString().slice(0, 10);
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0=zo..6=za
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
const weekdayIcons = ["🌙", "🦕", "🐶", "⛈️", "👋", "🪚", "🌞"];
function make7Days(weekStart) {
  return [...Array(7)].map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dow = (d.getDay() + 6) % 7; // maandag=0
    return {
      key: dfmt(d),
      date: d,
      icon: weekdayIcons[dow],
      label: `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`,
    };
  });
}

/* ---------- kleine subcomponents ---------- */
function Slot({ title, items, onAdd, onRemove }) {
  return (
    <div className="ws-slot">
      <div className="ws-slot-title">{title}</div>
      <div className="ws-slot-items">
        {(items || []).map((it) => (
          <button
            key={it.id}
            className="ws-chip"
            title={it.label}
            onClick={() => onRemove(it)}
          >
            {it.icon ? <img src={it.icon} alt="" /> : null}
            <span>{it.label}</span>
            <span className="x">×</span>
          </button>
        ))}
        <button className="ws-add" onClick={onAdd}>
          +
        </button>
      </div>
    </div>
  );
}

function LibraryPopup({ open, onClose, items, onPick }) {
  if (!open) return null;
  return (
    <div className="ws-lib-backdrop" onClick={onClose}>
      <div className="ws-lib" onClick={(e) => e.stopPropagation()}>
        <div className="ws-lib-head">
          <div>Bibliotheek</div>
          <button className="btn" onClick={onClose}>
            Sluiten
          </button>
        </div>
        <div className="ws-lib-grid">
          {items.map((it) => (
            <button
              className="ws-lib-item"
              key={it.id}
              onClick={() => {
                onPick(it);
                onClose();
              }}
            >
              {it.icon ? <img src={it.icon} alt="" /> : null}
              <div>{it.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Weekschema ---------- */
export default function WeekSchedulePanel({
  famId,
  users,
  dayplanMap,
  library,
}) {
  // filter alleen kinderen
  const kids = useMemo(
  () => (users || []).filter((u) => (u.role || "").toLowerCase() === "kind"),
  [users]
);

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const days = useMemo(() => make7Days(weekStart), [weekStart]);

  // schedule-map uit Firestore
  const [schedMap, setSchedMap] = useState({}); // key -> items

  useEffect(() => {
    if (!famId) return;
    const unsub = subscribeSchedule(famId, (docs) => {
      const map = {};
      docs.forEach((d) => {
        const key = `${d.kidId}__${d.dateKey}__${d.slot}`;
        map[key] = d.items || [];
      });
      setSchedMap(map);
    });
    return () => unsub && unsub();
  }, [famId]);

  // library-popup
  const [libTarget, setLibTarget] = useState(null);
  const openLib = (kidId, dateKey, slot) => setLibTarget({ kidId, dateKey, slot });
  const closeLib = () => setLibTarget(null);
  const onPickLib = async (item) => {
    if (!famId || !libTarget) return;
    await addScheduleItem(famId, libTarget, item);
  };

  const removeItem = async (kidId, dateKey, slot, item) => {
    if (!famId) return;
    await removeScheduleItem(famId, { kidId, dateKey, slot }, item);
  };

  const goPrev = () => {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7);
    setWeekStart(getMonday(d));
  };
  const goNext = () => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7);
    setWeekStart(getMonday(d));
  };
  const goToday = () => setWeekStart(getMonday(new Date()));

  return (
    <>
      <div className="ws-weekbar">
        <div className="left">
          <button className="btn" onClick={goPrev}>◀︎</button>
          <button className="btn" onClick={goToday}>Vandaag</button>
          <button className="btn" onClick={goNext}>▶︎</button>
          <div className="range">{days[0].label} – {days[6].label}</div>
        </div>
      </div>

      {/* dag header */}
      <div className="ws-days">
        <div className="ws-spacer" />
        {days.map((d) => (
          <div className="ws-day" key={d.key}>
            <div className="ws-day-ico">{d.icon}</div>
            <div className="ws-day-date">{d.label}</div>
          </div>
        ))}
      </div>

      {/* rijen */}
      <div className="ws-rows">
        {kids.map((kid) => (
          <div className="ws-row" key={kid.id || kid.displayName}>
            <div className="ws-kid">
              <div className="ws-kid-card">
                <img
                  className="avatar"
                  src={kid.avatar || "/avatars/default.png"}
                  alt=""
                  onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                />
                <div className="name">{kid.displayName || kid.name}</div>
                <div className="role">{kid.role}</div>
              </div>
            </div>

            {days.map((d) => {
              const dateKey = d.key;
              const isSchool = !!dayplanMap?.[kid.id]?.[dateKey]?.school;

              const makeSlot = (slot) => {
                const key = `${kid.id}__${dateKey}__${slot}`;
                const items = schedMap[key] || [];
                const title =
                  slot === "morning"
                    ? "Ochtend"
                    : slot === "noon"
                    ? isSchool ? "School" : "Middag"
                    : "Avond";

                return (
                  <Slot
                    key={slot}
                    title={title}
                    items={items}
                    onAdd={() => openLib(kid.id, dateKey, slot)}
                    onRemove={(it) => removeItem(kid.id, dateKey, slot, it)}
                  />
                );
              };

              return (
                <div className="ws-cell" key={dateKey}>
                  {makeSlot("morning")}
                  {makeSlot("noon")}
                  {makeSlot("evening")}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <LibraryPopup
        open={!!libTarget}
        onClose={closeLib}
        items={library || []}
        onPick={onPickLib}
      />

      {/* styles */}
      <style>{`
        .btn{
          border:1px solid #e5e7eb; background:#fff; border-radius:10px; padding:6px 10px; font-weight:600; cursor:pointer;
        }
        .ws-weekbar{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .ws-weekbar .left{ display:flex; align-items:center; gap:8px; }
        .ws-weekbar .range{ color:#6b7280; margin-left:8px; }

        .ws-days{
          display:grid; grid-template-columns: 220px repeat(7, minmax(140px, 1fr));
          gap:10px; margin-bottom:8px;
        }
        .ws-day{
          background:#fff; border:1px solid #e5e7eb; border-radius:14px; height:70px;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; font-weight:700;
        }
        .ws-day-ico{ font-size:20px; }

        .ws-rows{ display:flex; flex-direction:column; gap:12px; }
        .ws-row{
          display:grid; grid-template-columns: 220px repeat(7, minmax(140px,1fr)); gap:10px; align-items:stretch;
        }
        .ws-kid .ws-kid-card{
          background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:10px; display:flex; align-items:center; gap:10px;
        }
        .ws-kid .avatar{ width:44px; height:44px; border-radius:10px; object-fit:cover; }
        .ws-kid .name{ font-weight:700; }
        .ws-kid .role{ color:#6b7280; }

        .ws-cell{ display:flex; flex-direction:column; gap:8px; }
        .ws-slot{ background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:8px; }
        .ws-slot-title{ font-weight:700; margin-bottom:6px; }
        .ws-slot-items{ display:flex; flex-wrap:wrap; gap:6px; }
        .ws-chip{
          display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border:1px solid #e5e7eb; border-radius:999px; background:#fafafa;
        }
        .ws-chip img{ width:18px; height:18px; border-radius:4px; object-fit:cover; }
        .ws-chip .x{ margin-left:4px; opacity:.6; }
        .ws-add{
          width:26px; height:26px; border:1px dashed #cbd5e1; border-radius:50%;
          display:flex; align-items:center; justify-content:center; background:#fff; cursor:pointer;
        }

        .ws-lib-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.08); display:flex; align-items:center; justify-content:center; }
        .ws-lib{
          width:520px; max-width:90vw; background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:12px; display:flex; flex-direction:column; gap:10px;
        }
        .ws-lib-head{ display:flex; align-items:center; justify-content:space-between; font-weight:700; }
        .ws-lib-grid{ display:grid; grid-template-columns: repeat(auto-fill, minmax(110px,1fr)); gap:10px; }
        .ws-lib-item{
          background:#fafafa; border:1px solid #e5e7eb; border-radius:12px; padding:8px; display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer;
        }
        .ws-lib-item img{ width:40px; height:40px; object-fit:cover; border-radius:8px; }
      `}</style>
    </>
  );
}
