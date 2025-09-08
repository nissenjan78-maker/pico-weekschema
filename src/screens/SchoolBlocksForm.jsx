// src/screens/SchoolBlocksForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useFirestoreSync } from "../useFirestoreSync";

/* ========= helpers ========= */
function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dow1to7(d) {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}
function defBlocks(weekday) {
  const weekend = weekday === 6 || weekday === 7;
  return weekend
    ? {
        pre:    { id: "pre",    label: "Ochtend", start: "08:00", end: "12:00", allowTasks: true  },
        school: { id: "school", label: "Middag",  start: "12:00", end: "16:00", allowTasks: true  },
        post:   { id: "post",   label: "Avond",   start: "16:00", end: "19:45", allowTasks: true  },
      }
    : {
        pre:    { id: "pre",    label: "Ochtend", start: "07:00", end: "08:30", allowTasks: true  },
        school: { id: "school", label: "School",  start: "08:30", end: "16:00", allowTasks: false },
        post:   { id: "post",   label: "Avond",   start: "16:00", end: "19:45", allowTasks: true  },
      };
}
const WEEKDAGEN = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];
const DAYIC     = ["🌙","🦖","🐶","🌩️","👋","🪚","☀️"];

/* ========= tiny UI ========= */
function Button({ children, onClick, variant="primary", disabled, style, title }) {
  const pal = {
    primary: { bg: "#2563eb", hover: "#1d4ed8", fg: "#fff", border: "#1e40af" },
    ghost:   { bg: "#fff",    hover: "#f3f4f6", fg: "#111827", border: "#e5e7eb" },
  };
  const p = pal[variant] || pal.primary;
  return (
    <button
      type="button"
      title={title}
      onClick={(e)=>{ e.stopPropagation(); onClick?.(e); }}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${p.border}`,
        background: disabled ? "#9ca3af" : p.bg,
        color: p.fg,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      onMouseOver={(e)=>!disabled&&(e.currentTarget.style.background=p.hover)}
      onMouseOut={(e)=>!disabled&&(e.currentTarget.style.background=p.bg)}
    >
      {children}
    </button>
  );
}

/* ========= component ========= */
export default function SchoolBlocksForm({ onClose }) {
  const { data, save } = useFirestoreSync();
  const users = Array.isArray(data?.users) ? data.users : [];
  const kids = users.filter(u => u.role === "kind");
  const blockOverrides = (data?.blockOverrides && typeof data.blockOverrides === "object") ? data.blockOverrides : {};

  const [userId, setUserId] = useState(kids[0]?.id || "");
  const [saving, setSaving] = useState(false);

  const weekStart = useMemo(()=> startOfWeekMonday(new Date()), []);
  const weekDates = useMemo(()=>{
    return Array.from({length:7}).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // draft[iso] = { pre, school, post, isSchoolDay }
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (!userId) { setDraft({}); return; }
    const current = blockOverrides[userId] || {};
    const next = {};
    weekDates.forEach(d => {
      const iso = toISODate(d);
      const dow = dow1to7(d);
      const ov  = current[iso];
      let row;
      if (ov) {
        // normalize to safe strings
        const schoolIsSchool = ov.school?.label === "School" && ov.school?.allowTasks === false;
        row = {
          pre:    safeBlk("pre",    ov.pre,    "Ochtend", "07:00", "08:30", true),
          school: safeBlk("school", ov.school, schoolIsSchool ? "School" : "Middag", schoolIsSchool ? "08:30" : "12:00", "16:00", schoolIsSchool ? false : (ov.school?.allowTasks ?? true)),
          post:   safeBlk("post",   ov.post,   "Avond",   "16:00", "19:45", true),
          isSchoolDay: schoolIsSchool,
        };
      } else {
        const def = defBlocks(dow);
        row = {
          pre:    { ...def.pre    },
          school: { ...def.school },
          post:   { ...def.post   },
          isSchoolDay: def.school.label === "School" && def.school.allowTasks === false,
        };
      }
      next[iso] = row;
    });
    setDraft(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, /*blockOverrides,*/ weekDates]); // (laat live wisselen achterwege om "flikkeren" te vermijden)

  function safeBlk(id, src, fallbackLabel, defStart, defEnd, defAllow) {
    return {
      id,
      label: typeof src?.label === "string" ? src.label : fallbackLabel,
      start: typeof src?.start === "string" && src.start ? src.start : defStart,
      end:   typeof src?.end   === "string" && src.end   ? src.end   : defEnd,
      allowTasks: typeof src?.allowTasks === "boolean" ? src.allowTasks : !!defAllow,
    };
  }

  function setIso(iso, patch) {
    setDraft(prev => ({ ...prev, [iso]: { ...(prev[iso] || {}), ...patch } }));
  }

  function toggleSchoolDay(iso, checked) {
    const row = draft[iso]; if (!row) return;
    const school = { ...row.school };
    if (checked) {
      school.label = "School";
      school.allowTasks = false;
      // als je wil, pas je standaard tijden bij schooldag aan:
      if (!school.start) school.start = "08:30";
      if (!school.end)   school.end   = "16:00";
    } else {
      school.label = "Middag";
      if (school.allowTasks === false) school.allowTasks = true;
      if (!school.start) school.start = "12:00";
      if (!school.end)   school.end   = "16:00";
    }
    setIso(iso, { school, isSchoolDay: checked });
  }

  function changeTime(iso, blockId, key, value) {
    const row = draft[iso]; if (!row) return;
    // normaliseer "HH:MM"
    const v = (value || "").slice(0,5);
    const blk = { ...(row[blockId] || {}), [key]: v };
    setIso(iso, { [blockId]: blk });
  }

  function changeAllow(iso, blockId, allowed) {
    const row = draft[iso]; if (!row) return;
    const blk = { ...(row[blockId] || {}), allowTasks: !!allowed };
    setIso(iso, { [blockId]: blk });
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      const userOv = { ...(blockOverrides[userId] || {}) };
      weekDates.forEach(d => {
        const iso = toISODate(d);
        const row = draft[iso];
        if (!row) return;
        userOv[iso] = {
          pre: {
            id: "pre",
            label: row.pre?.label || "Ochtend",
            start: row.pre?.start || "07:00",
            end:   row.pre?.end   || "08:30",
            allowTasks: !!row.pre?.allowTasks,
          },
          school: {
            id: "school",
            label: row.isSchoolDay ? "School" : (row.school?.label || "Middag"),
            start: row.school?.start || (row.isSchoolDay ? "08:30" : "12:00"),
            end:   row.school?.end   || "16:00",
            allowTasks: row.isSchoolDay ? false : !!row.school?.allowTasks,
          },
          post: {
            id: "post",
            label: row.post?.label || "Avond",
            start: row.post?.start || "16:00",
            end:   row.post?.end   || "19:45",
            allowTasks: !!row.post?.allowTasks,
          },
        };
      });
      const next = { ...blockOverrides, [userId]: userOv };
      await save({ blockOverrides: next }); // merge in Firestore
      onClose && onClose();
    } finally {
      setSaving(false);
    }
  }

  const canSave = !!userId && Object.keys(draft).length === 7;

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Blokken — huidige week</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Kind:</span>
          <select
            value={userId}
            onChange={(e)=>setUserId(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}
          >
            {kids.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
          <Button variant="ghost" onClick={onClose}>Sluiten</Button>
          <Button onClick={handleSave} disabled={!canSave || saving} title={!canSave ? "Selecteer eerst een kind" : "Bewaren"}>
            {saving ? "Bewaren…" : "Bewaren"}
          </Button>
        </div>
      </div>

      {kids.length === 0 && (
        <div style={{ padding:16, color:"#b91c1c" }}>
          Er zijn (nog) geen kind-profielen. Voeg eerst een kind toe.
        </div>
      )}

      <div style={{ padding: 16, display: "grid", gap: 12 }}>
        {weekDates.map((d) => {
          const iso   = toISODate(d);
          const row   = draft[iso] || {};
          const dayIx = dow1to7(d);
          const name  = WEEKDAGEN[dayIx - 1];
          const ic    = DAYIC[dayIx - 1];

          return (
            <div key={iso} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 18 }}>{ic}</div>
                <div style={{ fontWeight: 800 }}>{name}</div>
                <div style={{ color: "#6b7280" }}>{iso}</div>
                <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={!!row.isSchoolDay}
                    onChange={(e)=>toggleSchoolDay(iso, e.target.checked)}
                    onPointerDown={(e)=>e.stopPropagation()}
                  />
                  Schooldag
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {/* Ochtend */}
                <BlockEditor
                  title="Ochtend"
                  allowTasks={row.pre?.allowTasks ?? true}
                  start={row.pre?.start ?? "07:00"}
                  end={row.pre?.end ?? "08:30"}
                  onStart={(v)=>changeTime(iso,"pre","start",v)}
                  onEnd={(v)=>changeTime(iso,"pre","end",v)}
                  onAllow={(v)=>changeAllow(iso,"pre",v)}
                />

                {/* School/Middag */}
                <BlockEditor
                  title={row.isSchoolDay ? "School" : "Middag"}
                  allowTasks={row.isSchoolDay ? false : (row.school?.allowTasks ?? true)}
                  start={row.school?.start ?? (row.isSchoolDay ? "08:30" : "12:00")}
                  end={row.school?.end ?? "16:00"}
                  onStart={(v)=>changeTime(iso,"school","start",v)}
                  onEnd={(v)=>changeTime(iso,"school","end",v)}
                  onAllow={(v)=>!row.isSchoolDay && changeAllow(iso,"school",v)}
                  disableAllow={row.isSchoolDay}
                />

                {/* Avond */}
                <BlockEditor
                  title="Avond"
                  allowTasks={row.post?.allowTasks ?? true}
                  start={row.post?.start ?? "16:00"}
                  end={row.post?.end ?? "19:45"}
                  onStart={(v)=>changeTime(iso,"post","start",v)}
                  onEnd={(v)=>changeTime(iso,"post","end",v)}
                  onAllow={(v)=>changeAllow(iso,"post",v)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 16, borderTop: "1px solid #e5e7eb", display:"flex", justifyContent:"flex-end", gap: 8 }}>
        <Button variant="ghost" onClick={onClose}>Annuleren</Button>
        <Button onClick={handleSave} disabled={!canSave || saving}>
          {saving ? "Bewaren…" : "Bewaren"}
        </Button>
      </div>
    </div>
  );
}

/* ====== small subcomponent to keep inputs clean ====== */
function BlockEditor({ title, start, end, allowTasks, onStart, onEnd, onAllow, disableAllow=false }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
        <span>Start</span>
        <input
          type="time"
          step="60"
          value={start}
          onChange={(e)=>onStart?.(e.target.value)}
          onPointerDown={(e)=>e.stopPropagation()}
          style={{ padding:"6px 8px", border:"1px solid #e5e7eb", borderRadius:8 }}
        />
        <span>Einde</span>
        <input
          type="time"
          step="60"
          value={end}
          onChange={(e)=>onEnd?.(e.target.value)}
          onPointerDown={(e)=>e.stopPropagation()}
          style={{ padding:"6px 8px", border:"1px solid #e5e7eb", borderRadius:8 }}
        />
      </div>
      <label style={{ opacity: disableAllow ? 0.5 : 1 }}>
        <input
          type="checkbox"
          checked={!!allowTasks}
          onChange={(e)=>!disableAllow && onAllow?.(e.target.checked)}
          disabled={disableAllow}
          onPointerDown={(e)=>e.stopPropagation()}
        />{" "}
        Taken toegestaan
      </label>
      {disableAllow && (
        <div style={{ fontSize:12, color:"#6b7280", marginTop:6 }}>
          Bij schooldag zijn taken in dit blok uitgeschakeld.
        </div>
      )}
    </div>
  );
}
