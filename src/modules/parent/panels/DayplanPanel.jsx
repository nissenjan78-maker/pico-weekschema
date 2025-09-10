import React, { useMemo, useState, useEffect, useCallback } from "react";

/** Small helpers */
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Mon
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

function weekKey(d) {
  const tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7)); // Thu of that week
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const weekNo =
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${tmp.getFullYear()}-W${pad2(weekNo)}`;
}
function weekRangeLabel(monday) {
  const end = addDays(monday, 6);
  return `${pad2(monday.getDate())}/${pad2(monday.getMonth() + 1)} – ${pad2(
    end.getDate()
  )}/${pad2(end.getMonth() + 1)}`;
}

/** pictos per weekdag (0..6 Mon..Sun) */
const weekdayIcons = [
  "/pictos/weekdays/maan.png",
  "/pictos/weekdays/dino.png",
  "/pictos/weekdays/hond.png",
  "/pictos/weekdays/donder.png",
  "/pictos/weekdays/vrienden.png",
  "/pictos/weekdays/zaag.png",
  "/pictos/weekdays/zon.png",
];

function DayHeader({ date }) {
  const idx = (date.getDay() + 6) % 7;
  const ico = weekdayIcons[idx];
  return (
    <div className="dp-daytile">
      <img src={ico} alt="" className="dp-day-ico" />
      <div className="dp-day-date">
        {pad2(date.getDate())}/{pad2(date.getMonth() + 1)}
      </div>
    </div>
  );
}

/** Vandaag + pijlen + datum */
function TodayNav({ monday, onChange }) {
  return (
    <div className="dp-todaynav">
      <button className="dp-navbtn" onClick={() => onChange(addDays(monday, -7))}>
        ◀
      </button>
      <button className="dp-todaybtn" onClick={() => onChange(startOfWeek(new Date()))}>
        Vandaag
      </button>
      <button className="dp-navbtn" onClick={() => onChange(addDays(monday, 7))}>
        ▶
      </button>
      <div className="dp-range">{weekRangeLabel(monday)}</div>
    </div>
  );
}

/** Fallback users (wanneer geen users in localStorage) */
const DEFAULT_USERS = [
  { id: "papa", name: "Papa", role: "Ouder", avatar: "/avatars/Papa.png" },
  { id: "leon", name: "Leon", role: "Kind", avatar: "/avatars/Leon.png" },
  { id: "lina", name: "Lina", role: "Kind", avatar: "/avatars/Lina.png" },
];

/** record per user per week */
const empty7 = (v) => Array.from({ length: 7 }, () => v);
function createUserWeekRecord(role) {
  if (role === "Ouder") {
    return {
      schoolOn: empty7(false),
      schoolStart: empty7(""),
      schoolEnd: empty7(""),
      wake: empty7(""),
      sleep: empty7(""),
    };
  }
  return {
    schoolOn: empty7(false),   // voor compat, niet gebruikt bij Kind
    schoolStart: empty7(""),
    schoolEnd: empty7(""),
    wake: empty7(""),
    sleep: empty7(""),
  };
}

export default function DayplanPanel({ householdId = "default", onClose }) {
  /** users */
  const [users, setUsers] = useState(DEFAULT_USERS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`users:${householdId}`);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) setUsers(list);
      }
    } catch {}
  }, [householdId]);

  /** current week */
  const [monday, setMonday] = useState(() => startOfWeek(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [
    monday,
  ]);
  const storageKey = useMemo(
    () => `dayplan:${householdId}:${weekKey(monday)}`,
    [householdId, monday]
  );

  /** form state */
  const [form, setForm] = useState({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) || {};
        // zorg dat nieuwe velden bestaan
        const patched = { ...parsed };
        users.forEach((u) => {
          if (!patched[u.id]) patched[u.id] = createUserWeekRecord(u.role);
          // defaults for missing arrays
          const rec = patched[u.id];
          ["schoolOn", "schoolStart", "schoolEnd", "wake", "sleep"].forEach((k) => {
            if (!Array.isArray(rec[k])) rec[k] = empty7(k === "schoolOn" ? false : "");
          });
        });
        setForm(patched);
      } else {
        const base = {};
        users.forEach((u) => (base[u.id] = createUserWeekRecord(u.role)));
        setForm(base);
      }
    } catch {
      const base = {};
      users.forEach((u) => (base[u.id] = createUserWeekRecord(u.role)));
      setForm(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, users]);

  // sync structuur wanneer users veranderen
  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      users.forEach((u) => {
        if (!next[u.id]) next[u.id] = createUserWeekRecord(u.role);
        const rec = next[u.id];
        ["schoolOn", "schoolStart", "schoolEnd", "wake", "sleep"].forEach((k) => {
          if (!Array.isArray(rec[k])) rec[k] = empty7(k === "schoolOn" ? false : "");
        });
      });
      Object.keys(next).forEach((k) => {
        if (!users.find((u) => u.id === k)) delete next[k];
      });
      return next;
    });
  }, [users]);

  const save = useCallback(() => {
    localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form, storageKey]);

  /** helpers om waarden te zetten */
  const setUserDayValue = (userId, field, dayIdx, value) => {
    setForm((prev) => {
      const rec = prev[userId] ?? createUserWeekRecord("Kind");
      const arr = Array.isArray(rec[field]) ? [...rec[field]] : empty7("");
      arr[dayIdx] = value;
      return { ...prev, [userId]: { ...rec, [field]: arr } };
    });
  };
  const setUserDayBool = (userId, field, dayIdx, value) => {
    setForm((prev) => {
      const rec = prev[userId] ?? createUserWeekRecord("Ouder");
      const arr = Array.isArray(rec[field]) ? [...rec[field]] : empty7(false);
      arr[dayIdx] = value;
      return { ...prev, [userId]: { ...rec, [field]: arr } };
    });
  };

  return (
    <div className="dp-wrap">
      {/* Top: nav links (boven Papa) + actions rechts */}
      <div className="dp-top">
        <TodayNav monday={monday} onChange={setMonday} />
        <div className="dp-actions">
          <button className="btn" onClick={save}>Opslaan</button>
          <button className="btn" onClick={onClose}>Sluiten</button>
        </div>
      </div>

      {/* weekday tiles (boven de kolommen) */}
      <div className="dp-days">
        {days.map((d) => (
          <DayHeader key={d.toISOString()} date={d} />
        ))}
      </div>

      {/* grid rows */}
      <div className="dp-grid">
        {users.map((u) => (
          <div className="dp-row" key={u.id}>
            <div className="dp-usercell">
              <img
                src={u.avatar}
                alt=""
                className="dp-avatar"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div>
                <div className="dp-username">{u.name}</div>
                <div className="dp-userrole">{u.role}</div>
              </div>
            </div>

            {days.map((_, dayIdx) => {
              const rec = form[u.id] ?? createUserWeekRecord(u.role);

              if (u.role === "Ouder") {
                const enabled = !!rec.schoolOn?.[dayIdx];
                return (
                  <div className="dp-daycell" key={dayIdx}>
                    <div className="dp-fieldtitle">Schooldag</div>
                    <label className="dp-check">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          setUserDayBool(u.id, "schoolOn", dayIdx, e.target.checked)
                        }
                      />
                      <span>aan</span>
                    </label>

                    <div className="dp-fieldgroup" style={{ marginTop: 6 }}>
                      <div className="dp-label">Begin</div>
                      <input
                        className="dp-input"
                        value={rec.schoolStart?.[dayIdx] || ""}
                        onChange={(e) =>
                          setUserDayValue(u.id, "schoolStart", dayIdx, e.target.value)
                        }
                        placeholder="-- : --"
                        disabled={!enabled}
                      />
                    </div>
                    <div className="dp-fieldgroup">
                      <div className="dp-label">Einde</div>
                      <input
                        className="dp-input"
                        value={rec.schoolEnd?.[dayIdx] || ""}
                        onChange={(e) =>
                          setUserDayValue(u.id, "schoolEnd", dayIdx, e.target.value)
                        }
                        placeholder="-- : --"
                        disabled={!enabled}
                      />
                    </div>
                  </div>
                );
              }

              // KIND: Opstaan + Slapen
              return (
                <div className="dp-daycell" key={dayIdx}>
                  <div className="dp-fieldtitle">Opstaan</div>
                  <input
                    className="dp-input"
                    value={rec.wake?.[dayIdx] || ""}
                    onChange={(e) =>
                      setUserDayValue(u.id, "wake", dayIdx, e.target.value)
                    }
                    placeholder="-- : --"
                  />
                  <div className="dp-fieldtitle" style={{ marginTop: 8 }}>
                    Slapen
                  </div>
                  <input
                    className="dp-input"
                    value={rec.sleep?.[dayIdx] || ""}
                    onChange={(e) =>
                      setUserDayValue(u.id, "sleep", dayIdx, e.target.value)
                    }
                    placeholder="-- : --"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        .btn{
          padding:6px 10px; border:1px solid #e5e7eb; background:#fff;
          border-radius:10px; font-weight:600; cursor:pointer;
        }
        .dp-wrap{
          background:#fff; border:1px solid #e5e7eb; border-radius:18px; padding:14px;
        }
        .dp-top{
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          flex-wrap:wrap;
          margin-bottom:10px;
        }
        .dp-actions{ display:flex; align-items:center; gap:8px; }

        .dp-todaynav{ display:flex; align-items:center; gap:8px; }
        .dp-navbtn{
          width:30px; height:30px; border:1px solid #e5e7eb; background:#fff; border-radius:10px;
        }
        .dp-todaybtn{
          border:1px solid #e5e7eb; background:#fff; border-radius:10px; padding:6px 10px; font-weight:600;
        }
        .dp-range{ margin-left:10px; color:#6b7280; }

        .dp-days{
          display:grid; grid-template-columns: repeat(7, 1fr); gap:12px;
          margin-bottom:12px;
        }
        .dp-daytile{
          border:1px solid #e5e7eb; border-radius:14px; padding:10px;
          display:flex; flex-direction:column; align-items:center; gap:6px;
          min-height:70px;
        }
        .dp-day-ico{ width:36px; height:36px; object-fit:contain; }
        .dp-day-date{ font-weight:700; }

        .dp-grid{ display:flex; flex-direction:column; gap:12px; }
        .dp-row{
          display:grid; grid-template-columns: 220px repeat(7, minmax(150px, 1fr));
          gap:12px; align-items:stretch;
        }
        .dp-usercell{
          border:1px solid #e5e7eb; border-radius:14px; padding:10px;
          display:flex; align-items:center; gap:12px;
        }
        .dp-avatar{ width:56px; height:56px; border-radius:12px; object-fit:cover; }
        .dp-username{ font-weight:800; }
        .dp-userrole{ color:#6b7280; }

        .dp-daycell{
          border:1px solid #e5e7eb; border-radius:14px; padding:10px;
          display:flex; flex-direction:column;
        }
        .dp-fieldtitle{ font-weight:700; margin-bottom:4px; }
        .dp-fieldgroup{ display:flex; flex-direction:column; gap:4px; margin-top:4px; }
        .dp-label{ color:#6b7280; font-size:12px; }
        .dp-input{
          height:36px; border:1px solid #e5e7eb; border-radius:10px; padding:0 10px;
          font-family: inherit;
        }
        .dp-check{ display:flex; align-items:center; gap:6px; margin-top:2px; }
      `}</style>
    </div>
  );
}
