// src/WeekschemaApp.jsx
// Clean standalone version — no login/device modules — sync via useFirestoreSync only

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFirestoreSync } from "./useFirestoreSync";

/* =========================
   Utils
   ========================= */
const dfNL = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" });
function fmtDateHumanNL(d) {
  const s = dfNL.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function uid(p = "id") {
  return `${p}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}
function toISODate(d) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfWeekMonday(dateLike) {
  const d = new Date(dateLike);
  const day = d.getDay(); // 0..6 (zo..za)
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getISOWeek(date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + (4 - day));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
}
function getWeekDates(anchor) {
  const start = startOfWeekMonday(anchor);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function dow1to7(d) {
  const js = (d instanceof Date ? d : new Date(d)).getDay();
  return js === 0 ? 7 : js; // ma=1 .. zo=7
}
function timeToMinutes(t) {
  if (!t) return null;
  const [hh, mm] = t.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}
function fmtSec(s) {
  const seconds = Math.max(0, s | 0);
  const m = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
function timerKey(taskId, userId, date, block) {
  return [taskId, userId, date, block].filter(Boolean).join("__");
}

/* =========================
   Consts & demo data
   ========================= */
const WEEKDAGEN = [
  { idx: 1, label: "Maandag", icon: "🌙" },
  { idx: 2, label: "Dinsdag", icon: "🦖" },
  { idx: 3, label: "Woensdag", icon: "🐶" },
  { idx: 4, label: "Donderdag", icon: "🌩️" },
  { idx: 5, label: "Vrijdag", icon: "👋" },
  { idx: 6, label: "Zaterdag", icon: "🪚" },
  { idx: 7, label: "Zondag", icon: "☀️" },
];

function defaultBlocks(weekday) {
  const isWeekend = weekday === 6 || weekday === 7;
  if (isWeekend) {
    return [
      { id: "pre", label: "Ochtend", start: "08:00", end: "12:00", allowTasks: true },
      { id: "school", label: "Middag", start: "12:00", end: "16:00", allowTasks: true },
      { id: "post", label: "Avond", start: "16:00", end: "19:45", allowTasks: true },
    ];
  }
  return [
    { id: "pre", label: "Ochtend", start: "07:00", end: "08:30", allowTasks: true },
    { id: "school", label: "School", start: "08:30", end: "16:00", allowTasks: false },
    { id: "post", label: "Avond", start: "16:00", end: "19:45", allowTasks: true },
  ];
}
function blockEmoji(meta) {
  if (meta.id === "pre") return "🌅";
  if (meta.id === "school") return meta.allowTasks ? "🌤️" : "🏫";
  if (meta.id === "post") return "🌙";
  return "🧭";
}

// pictos (public/pictos) voor demo
const PICTO_READ = "/pictos/lezen.png";
const PICTO_BATH = "/pictos/inbad.png";
const PICTO_BRUSH = "/pictos/tandenpoetsen.png";
const PICTO_SLEEP = "/pictos/slapen.png";

// demo gebruikers
const DEMO_USERS = [
  { id: "u_papa", name: "Papa", role: "ouder", avatar: "/avatars/Pico.png" },
  { id: "u_leon", name: "Leon", role: "kind", avatar: "/avatars/Leon.png" },
  { id: "u_lina", name: "Lina", role: "kind", avatar: "/avatars/Lina.png" },
];

// demo library + taken
const DEFAULT_LIBRARY = [
  { id: "lib_tanden", title: "Tanden poetsen", type: "image", imageUrl: PICTO_BRUSH, defaultBlocks: ["pre", "post"], defaultDuration: 1, category: "Zelfzorg" },
  { id: "lib_ontbijt", title: "Ontbijt", type: "text", imageUrl: "", defaultBlocks: ["pre"], defaultDuration: 0, category: "Eten" },
  { id: "lib_inbad", title: "In bad", type: "image", imageUrl: PICTO_BATH, defaultBlocks: ["post"], defaultDuration: 10, category: "Zelfzorg" },
  { id: "lib_lezen", title: "Lezen", type: "image", imageUrl: PICTO_READ, defaultBlocks: ["post"], defaultDuration: 15, category: "Rust" },
  { id: "lib_slapen", title: "Slapen", type: "image", imageUrl: PICTO_SLEEP, defaultBlocks: ["post"], defaultDuration: 0, category: "Rust" },
];
const DEFAULT_TASKS = [
  { id: uid("t"), assigneeId: "u_lina", title: "Tanden poetsen", displayType: "image", imageUrl: PICTO_BRUSH, days: [1, 2, 3, 4, 5], blocks: ["pre", "post"], durationMinutes: 1, libraryId: "lib_tanden" },
  { id: uid("t"), assigneeId: "u_lina", title: "In bad", displayType: "image", imageUrl: PICTO_BATH, days: [5], blocks: ["post"], durationMinutes: 10, libraryId: "lib_inbad" },
  { id: uid("t"), assigneeId: "u_lina", title: "Lezen", displayType: "image", imageUrl: PICTO_READ, days: [5], blocks: ["post"], durationMinutes: 15, libraryId: "lib_lezen" },
  { id: uid("t"), assigneeId: "u_lina", title: "Slapen", displayType: "image", imageUrl: PICTO_SLEEP, days: [5], blocks: ["post"], durationMinutes: 0, libraryId: "lib_slapen" },
];

/* =========================
   Mini UI helpers
   ========================= */
function Button({ children, onClick, variant = "primary", disabled, title, style }) {
  const pal = {
    primary: { bg: "#2563eb", hover: "#1d4ed8", fg: "#fff", border: "#1e40af" },
    ghost: { bg: "#fff", hover: "#f3f4f6", fg: "#111827", border: "#e5e7eb" },
    danger: { bg: "#dc2626", hover: "#b91c1c", fg: "#fff", border: "#991b1b" },
  };
  const p = pal[variant] || pal.primary;
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
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
      onMouseOver={(e) => !disabled && (e.currentTarget.style.background = p.hover)}
      onMouseOut={(e) => !disabled && (e.currentTarget.style.background = p.bg)}
    >
      {children}
    </button>
  );
}
function IconButton({ label, onClick, disabled, title }) {
  return (
    <button
      type="button"
      title={title || label}
      onClick={(e) => {
        e.stopPropagation();
        !disabled && onClick?.();
      }}
      disabled={disabled}
      style={{
        padding: "6px 8px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: disabled ? "#f3f4f6" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 16,
      }}
    >
      {label}
    </button>
  );
}
function Select({ value, onChange, children, style, name, id }) {
  return (
    <select
      name={name}
      id={id}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", ...style }}
    >
      {children}
    </select>
  );
}
function Avatar({ value, size = 24 }) {
  const isUrl = typeof value === "string" && /^\/avatars\/.+\.(png|jpe?g|gif|svg|webp)$/i.test(value);
  return isUrl ? (
    <img src={value} alt="" style={{ width: size, height: size, objectFit: "cover", borderRadius: "50%", display: "inline-block" }} draggable={false} />
  ) : (
    <span style={{ fontSize: size, lineHeight: 1 }}>{value || "🙂"}</span>
  );
}

/* =========================
   Modals
   ========================= */
function ModalShell({ title, onClose, children, footer, width = 560 }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "grid", placeItems: "center", zIndex: 50 }}
      onClick={() => {}}
    >
      <div
        style={{
          width,
          maxWidth: "calc(100% - 32px)",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", border: "1px solid #e5e7eb", background: "#fff", borderRadius: 10, padding: "6px 10px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ display: "grid", gap: 12 }}>{children}</div>
        {footer && <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

/* =========================
   Main App
   ========================= */
export default function WeekschemaApp() {
  // Firestore sync (must come from your hook)
  const { data, save, ready } = useFirestoreSync();

  // Safe snapshots (fallbacks if nothing in Firestore yet)
  const users = Array.isArray(data?.users) && data.users.length ? data.users : DEMO_USERS;
  const tasks = Array.isArray(data?.tasks) ? data.tasks : DEFAULT_TASKS;
  const library = Array.isArray(data?.library) ? data.library : DEFAULT_LIBRARY;
  const suppressions = Array.isArray(data?.suppressions) ? new Set(data.suppressions) : new Set();
  const completions = Array.isArray(data?.completions) ? data.completions : [];
  const timers = Array.isArray(data?.timers) ? data.timers : [];
  const sortOrders = data?.sortOrders && typeof data.sortOrders === "object" ? data.sortOrders : {};
  const blockOverrides = data?.blockOverrides && typeof data.blockOverrides === "object" ? data.blockOverrides : {};

  // Local UI state
  const [currentUserId, setCurrentUserId] = useState(users[0]?.id || "u_papa");
  const [visibleUserId, setVisibleUserId] = useState(users.find((u) => u.role === "kind")?.id || users[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [parentView, setParentView] = useState("showChild"); // showChild | dashboard | library

  // Keep ids valid when users sync in
  useEffect(() => {
    if (!users.length) return;
    setCurrentUserId((prev) => (users.some((u) => u.id === prev) ? prev : users[0]?.id || ""));
    setVisibleUserId((prev) => {
      const ok = users.some((u) => u.id === prev && u.role === "kind");
      if (ok) return prev;
      const firstKid = users.find((u) => u.role === "kind")?.id;
      return firstKid || users[0]?.id || "";
    });
  }, [users]);

  const viewer = users.find((u) => u.id === currentUserId) || users[0] || null;
  const visible = users.find((u) => u.id === visibleUserId) || users.find((u) => u.role === "kind") || users[0] || null;

  const selectedISO = toISODate(selectedDate);
  const selectedDayIdx = dow1to7(selectedDate);

  // Safe push to Firestore (no crash if save missing)
  const push = useCallback(
    (partial) => {
      const payload = {
        users,
        tasks,
        library,
        suppressions: Array.from(suppressions),
        completions,
        timers,
        sortOrders,
        blockOverrides,
        ...partial,
      };
      if (typeof save === "function") {
        try {
          save(payload);
        } catch (e) {
          console.warn("save() failed:", e);
        }
      } else {
        console.warn("useFirestoreSync() yieldde geen save-functie — payload:", payload);
      }
    },
    [save, users, tasks, library, suppressions, completions, timers, sortOrders, blockOverrides]
  );

  /* ---------- audio for timer done ---------- */
  const audioCtxRef = useRef(null);
  const unlockedRef = useRef(false);
  function beep() {
    if (!unlockedRef.current) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = audioCtxRef.current || (audioCtxRef.current = new Ctx());
      ctx.resume && ctx.resume();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }

  /* ---------- blocks & occurrences ---------- */
  const blocks = useMemo(() => {
    if (!visible) return defaultBlocks(selectedDayIdx);
    const ov = blockOverrides?.[visible.id]?.[selectedISO];
    return ov ? [ov.pre, ov.school, ov.post] : defaultBlocks(selectedDayIdx);
  }, [visible, selectedISO, selectedDayIdx, blockOverrides]);

  const occ = useMemo(() => {
    if (!visible) return { pre: [], school: [], post: [] };
    const out = { pre: [], school: [], post: [] };
    for (const t of tasks) {
      if (t.assigneeId !== visible.id) continue;
      if (!t.days?.includes(selectedDayIdx)) continue;
      for (const b of t.blocks || []) {
        const meta = blocks.find((x) => x.id === b);
        if (!meta) continue;
        if (b === "school" && !meta.allowTasks && !t.schoolActiviteit) continue;
        if (suppressions.has(`${t.id}__${selectedISO}__${b}`)) continue;
        out[b]?.push({ task: t, blockId: b });
      }
    }
    return out;
  }, [tasks, visible, selectedDayIdx, blocks, suppressions, selectedISO]);

  /* ---------- done set ---------- */
  const doneSet = useMemo(() => {
    const s = new Set();
    if (!visible) return s;
    completions
      .filter((c) => c.userId === visible.id && c.date === selectedISO)
      .forEach((c) => s.add(`${c.taskId}::${c.block}`));
    return s;
  }, [completions, visible, selectedISO]);

  /* ---------- ordering ---------- */
  function orderKey(userId, day, block) {
    return `${userId}__${day}__${block}`;
  }
  function getSorted(list, blockId) {
    if (!visible) return list;
    const key = orderKey(visible.id, selectedDayIdx, blockId);
    const order = sortOrders[key] || [];
    const pos = (id) => {
      const i = order.indexOf(id);
      return i === -1 ? Number.POSITIVE_INFINITY : i;
    };
    return [...list].sort((a, b) => pos(a.task.id) - pos(b.task.id));
  }
  function ensureOrderFor(list, blockId) {
    if (!visible) return;
    const key = orderKey(visible.id, selectedDayIdx, blockId);
    const ids = list.map((o) => o.task.id);
    const curr = sortOrders[key] || [];
    const next = curr.filter((id) => ids.includes(id));
    ids.forEach((id) => {
      if (!next.includes(id)) next.push(id);
    });
    if (JSON.stringify(curr) !== JSON.stringify(next)) {
      push({ sortOrders: { ...sortOrders, [key]: next } });
    }
  }
  function moveUp(taskId, blockId, visibleList) {
    if (!visible) return;
    const key = orderKey(visible.id, selectedDayIdx, blockId);
    const current = sortOrders[key] || visibleList.map((x) => x.task.id);
    const idx = current.indexOf(taskId);
    if (idx <= 0) return;
    const next = [...current];
    next.splice(idx, 1);
    next.splice(idx - 1, 0, taskId);
    push({ sortOrders: { ...sortOrders, [key]: next } });
  }
  function moveDown(taskId, blockId, visibleList) {
    if (!visible) return;
    const key = orderKey(visible.id, selectedDayIdx, blockId);
    const current = sortOrders[key] || visibleList.map((x) => x.task.id);
    const idx = current.indexOf(taskId);
    if (idx === -1 || idx >= current.length - 1) return;
    const next = [...current];
    next.splice(idx, 1);
    next.splice(idx + 1, 0, taskId);
    push({ sortOrders: { ...sortOrders, [key]: next } });
  }

  /* ---------- toggle done ---------- */
  function toggleDone(taskId, blockId) {
    if (!visible?.id) return;
    const idx = completions.findIndex((c) => c.taskId === taskId && c.userId === visible.id && c.date === selectedISO && c.block === blockId);
    if (idx >= 0) {
      const cp = [...completions];
      cp.splice(idx, 1);
      push({ completions: cp });
    } else {
      push({ completions: [...completions, { id: uid("done"), taskId, userId: visible.id, date: selectedISO, block: blockId }] });
    }
  }

  /* ---------- timers (per occurrence) ---------- */
  function startTimer(task, blockId) {
    if (!visible?.id) return;
    if (!(task.durationMinutes > 0)) return;
    try {
      if (!unlockedRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) {
          audioCtxRef.current = audioCtxRef.current || new Ctx();
          audioCtxRef.current.resume && audioCtxRef.current.resume();
          unlockedRef.current = true;
        }
      }
    } catch {}
    const id = timerKey(task.id, visible.id, selectedISO, blockId);
    const ex = timers.find((t) => t.id === id);
    const remaining = ex ? ex.remainingSec : task.durationMinutes * 60;
    const next = ex
      ? timers.map((t) => (t.id === id ? { ...t, status: "running" } : t))
      : [...timers, { id, taskId: task.id, userId: visible.id, date: selectedISO, block: blockId, remainingSec: remaining, status: "running" }];
    push({ timers: next });
  }
  function pauseTimer(taskId, blockId) {
    if (!visible?.id) return;
    const id = timerKey(taskId, visible.id, selectedISO, blockId);
    const next = timers.map((t) => (t.id === id ? { ...t, status: "paused" } : t));
    push({ timers: next });
  }
  function restartOccurrence(taskId, blockId, minutes) {
    if (!visible?.id) return;
    const id = timerKey(taskId, visible.id, selectedISO, blockId);
    const secs = Math.max(1, (minutes || 1) * 60);
    const timersNext = (() => {
      const ex = timers.find((t) => t.id === id);
      if (ex) return timers.map((t) => (t.id === id ? { ...t, remainingSec: secs, status: "paused" } : t));
      return [...timers, { id, taskId, userId: visible.id, date: selectedISO, block: blockId, remainingSec: secs, status: "paused" }];
    })();
    const completionsNext = completions.filter((c) => !(c.taskId === taskId && c.userId === visible.id && c.date === selectedISO && c.block === blockId));
    push({ timers: timersNext, completions: completionsNext });
  }
  // Tick
  useEffect(() => {
    const iv = setInterval(() => {
      if (!timers.length) return;
      let changed = false;
      const next = timers.map((t) => {
        if (t.status !== "running") return t;
        const r = Math.max(0, (t.remainingSec || 0) - 1);
        if (r !== t.remainingSec) changed = true;
        return { ...t, remainingSec: r };
      });
      if (changed) push({ timers: next });
    }, 1000);
    return () => clearInterval(iv);
  }, [timers, push]);
  // Autocomplete on zero (once)
  useEffect(() => {
    if (!visible?.id) return;
    const finished = timers.filter((t) => t.status === "running" && t.remainingSec === 0);
    if (!finished.length) return;
    const timersPaused = timers.map((t) => (t.remainingSec === 0 ? { ...t, status: "paused" } : t));
    let comps = [...completions];
    finished.forEach((ft) => {
      const already = comps.some((c) => c.taskId === ft.taskId && c.userId === ft.userId && c.date === ft.date && c.block === ft.block);
      if (!already) comps.push({ id: uid("done"), taskId: ft.taskId, userId: ft.userId, date: ft.date, block: ft.block });
      beep();
    });
    push({ timers: timersPaused, completions: comps });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timers]);

  /* =========================
     Headers
     ========================= */
  function UsersHeader() {
    const isParent = viewer?.role === "ouder";
    return (
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
          borderBottom: "1px solid #e5e7eb",
          background: "#fafafa",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        {users.map((u) => {
          if (!u) return null;
          const active = u.id === currentUserId;
          return (
            <div
              key={u.id}
              onClick={() => {
                setCurrentUserId(u.id);
                if (u.role === "kind") {
                  setVisibleUserId(u.id);
                  setParentView("showChild");
                } else {
                  setParentView("dashboard");
                }
              }}
              style={{
                cursor: "pointer",
                padding: "12px 16px",
                borderRadius: 14,
                border: active ? "2px solid #2563eb" : "1px solid #e5e7eb",
                background: active ? "#e0e7ff" : "#fff",
                textAlign: "center",
                minWidth: 120,
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <Avatar value={u.avatar} size={64} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>{u.name}</div>
            </div>
          );
        })}
        <div style={{ marginLeft: 12 }}>
          {isParent ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#1e40af",
                background: "#e0e7ff",
                border: "1px solid #93c5fd",
                borderRadius: 999,
                padding: "4px 10px",
              }}
            >
              👨‍🦱 Ouder-modus
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#6b7280", border: "1px dashed #cbd5e1", borderRadius: 999, padding: "4px 10px" }}>
              Kind-modus
            </span>
          )}
        </div>
      </div>
    );
  }

  /* =========================
     Library (simpel)
     ========================= */
  function TaskLibraryPanel() {
    const [controls, setControls] = useState(
      Object.fromEntries(
        library.map((t) => [
          t.id,
          {
            pre: t.defaultBlocks.includes("pre"),
            school: t.defaultBlocks.includes("school"),
            post: t.defaultBlocks.includes("post"),
            dur: t.defaultDuration,
          },
        ])
      )
    );
    const toggle = (id, key) => setControls((c) => ({ ...c, [id]: { ...c[id], [key]: !c[id][key] } }));
    const addToChild = (lib, childId) => {
      if (!childId) return;
      const c = controls[lib.id] || { pre: false, school: false, post: true, dur: lib.defaultDuration };
      const picked = ["pre", "school", "post"].filter((b) => c[b]);
      const newTask = {
        id: uid("t"),
        libraryId: lib.id,
        assigneeId: childId,
        title: lib.title,
        displayType: lib.type === "image" ? "image" : "text",
        imageUrl: lib.type === "image" ? lib.imageUrl : undefined,
        days: [selectedDayIdx],
        blocks: picked.length ? picked : lib.defaultBlocks,
        durationMinutes: Math.max(0, parseInt(c.dur ?? lib.defaultDuration, 10
