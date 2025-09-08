import React, { useMemo, useCallback } from "react";

/**
 * Props (alles blijft backward-compatible):
 *  required/bestaand:
 *   - assignments, LIB_BY_ID, DAY_IDS, BLOCKS, monday, addDays,
 *     gotoPrevWeek, gotoThisWeek, gotoNextWeek, onDropTask, removeTask
 *
 *  optional/nieuw:
 *   - users: Array<{id,name,role,avatar?}>
 *   - activeUserId: string
 *   - onFocusUser: (id:string)=>void
 *   - blockOverrides: { [userId]: { [isoDate]: { schoolDay?: boolean } } }
 *   - toISO?: (date: Date) => string
 *   - filteredLibrary  |  buildFilteredLibrary?: (userId?:string, weekStart?:Date)=>Array
 *   - AvatarComponent?: React.FC<{src?:string, alt?:string, size?:number}>
 */
export default function WeekSchedulePanel(props) {
  const {
    // core
    filteredLibrary,
    assignments,
    LIB_BY_ID,
    DAY_IDS,
    BLOCKS,
    monday,
    addDays,
    gotoPrevWeek,
    gotoThisWeek,
    gotoNextWeek,
    onDropTask,
    removeTask,
    // nieuw
    users,
    activeUserId,
    onFocusUser,
    blockOverrides,
    toISO,
    buildFilteredLibrary,
    AvatarComponent,
  } = props;

  // ---------- helpers & fallbacks ----------
  const SAFE_DAY_IDS = Array.isArray(DAY_IDS) && DAY_IDS.length === 7
    ? DAY_IDS
    : ["mon","tue","wed","thu","fri","sat","sun"];

  const SAFE_BLOCKS = Array.isArray(BLOCKS) && BLOCKS.length
    ? BLOCKS
    : [{id:"morning",label:"Ochtend"},{id:"noon",label:"Middag"},{id:"evening",label:"Avond"}];

  const SAFE_LIB_BY_ID = LIB_BY_ID ?? {};
  const safeAddDays = typeof addDays === "function"
    ? addDays
    : (d,n)=> new Date(d.getTime() + n*86400000);

  const weekMonday = (monday instanceof Date && !isNaN(monday))
    ? monday
    : (() => {
        const now = new Date();
        const day = (now.getDay() + 6) % 7; // ma=0
        const m = new Date(now); m.setHours(0,0,0,0); m.setDate(now.getDate()-day);
        return m;
      })();

  const iso = toISO ?? ((d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${dd}`;
  });

  // ---------- alleen kinderen in de chipbar ----------
  const kidUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(u => (u.role || "").toLowerCase() === "kind");
  }, [users]);

  // active kind (als activeUserId geen kind is → kies eerste kind)
  const currentUserId = useMemo(() => {
    if (kidUsers.length === 0) return undefined;
    const activeIsKid = kidUsers.some(k => k.id === activeUserId);
    return activeIsKid ? activeUserId : kidUsers[0].id;
  }, [kidUsers, activeUserId]);

  // ---------- library (user-aware + fallback) ----------
  const SAFE_LIBRARY = useMemo(() => {
    if (typeof buildFilteredLibrary === "function") {
      try {
        const arr = buildFilteredLibrary(currentUserId, weekMonday);
        if (Array.isArray(arr)) return arr;
      } catch {}
    }
    if (Array.isArray(filteredLibrary)) return filteredLibrary;
    const all = Object.values(SAFE_LIB_BY_ID);
    return all;
  }, [buildFilteredLibrary, currentUserId, weekMonday, filteredLibrary, SAFE_LIB_BY_ID]);

  // ---------- daglabels (nl-BE dd/mm) ----------
  const dayLabels = useMemo(() => {
    const fmt = (d) =>
      new Intl.DateTimeFormat("nl-BE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(d);
    return SAFE_DAY_IDS.map((_, i) => fmt(safeAddDays(weekMonday, i)));
  }, [SAFE_DAY_IDS, weekMonday, safeAddDays]);

  const weekLabel = useMemo(() => {
    const s = safeAddDays(weekMonday, 0);
    const e = safeAddDays(weekMonday, 6);
    const f = new Intl.DateTimeFormat("nl-BE", { day: "2-digit", month: "2-digit" });
    return `${f.format(s)} – ${f.format(e)}`;
  }, [weekMonday, safeAddDays]);

  // ---------- bloklabel: “School” i.p.v. “Middag” wanneer schoolDay === true ----------
  const labelFor = useCallback(
    (blkId, dayIdx, fallback) => {
      if (blkId !== "noon") return fallback;
      if (!currentUserId || !blockOverrides) return fallback;
      const d = safeAddDays(weekMonday, dayIdx);
      const cfg = blockOverrides?.[currentUserId]?.[iso(d)];
      return cfg?.schoolDay ? "School" : fallback;
    },
    [currentUserId, blockOverrides, iso, weekMonday, safeAddDays]
  );

  // ---------- DnD ----------
  const onDragFromLib = useCallback((e, taskId) => {
    e.dataTransfer.setData("application/x-task-id", String(taskId));
    e.dataTransfer.effectAllowed = "copyMove";
  }, []);
  const onDragFromCell = useCallback((e, taskId, from) => {
    e.dataTransfer.setData("application/x-task-id", String(taskId));
    e.dataTransfer.setData("application/x-from-day", from.dayId);
    e.dataTransfer.setData("application/x-from-block", from.blockId);
    e.dataTransfer.effectAllowed = "move";
  }, []);
  const onDragOver = useCallback((e) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "copy";
    e.currentTarget.dataset.dragover = "true";
  }, []);
  const onDragLeave = useCallback((e) => { e.currentTarget.dataset.dragover = "false"; }, []);
  const onDropToCell = useCallback((e, dayId, blockId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("application/x-task-id");
    if (!taskId) return;
    const fromDay = e.dataTransfer.getData("application/x-from-day") || undefined;
    const fromBlock = e.dataTransfer.getData("application/x-from-block") || undefined;
    e.currentTarget.dataset.dragover = "false";
    props.onDropTask?.(dayId, blockId, taskId, fromDay && fromBlock ? { dayId: fromDay, blockId: fromBlock } : undefined);
  }, [props]);

  return (
    <div className="ws-layout">
      {/* ------- Bibliotheek (links) ------- */}
      <aside className="ws-lib-panel">
        {/* Chipbar: alleen kinderen */}
        {kidUsers.length > 0 && (
          <div className="ws-userbar">
            {kidUsers.map((u) => {
              const active = u.id === currentUserId;
              return (
                <button
                  key={u.id}
                  type="button"
                  className={`ws-userchip${active ? " is-active" : ""}`}
                  onClick={() => props.onFocusUser?.(u.id)}
                  title={u.name}
                >
                  {AvatarComponent ? (
                    <AvatarComponent src={u.avatar} alt={u.name} size={22} />
                  ) : u.avatar ? (
                    <img className="ws-userchip-img" src={u.avatar} alt="" />
                  ) : (
                    <span className="ws-userchip-dot" />
                  )}
                  <span className="ws-userchip-name">{u.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="ws-lib-head">
          <h3 className="ws-title">Bibliotheek</h3>
          <p className="ws-sub">Sleep taken naar een dagblok</p>
        </div>

        <div className="ws-lib-list">
          {SAFE_LIBRARY.length ? (
            SAFE_LIBRARY.map((t) => (
              <div
                key={t.id}
                className="ws-lib-item"
                draggable
                onDragStart={(e) => onDragFromLib(e, t.id)}
                title="Sleep naar een dagblok"
                role="button"
              >
                {t.icon ? <span className="ws-icon" aria-hidden>{t.icon}</span> : <span className="ws-dot" />}
                <span className="ws-lib-text">{t.title}</span>
              </div>
            ))
          ) : (
            <div className="ws-lib-empty">Geen items in de bibliotheek.</div>
          )}
        </div>

        <div className="ws-weekbar">
          <button className="ws-btn" onClick={gotoPrevWeek} title="Vorige week">◀</button>
          <button className="ws-btn" onClick={gotoThisWeek} title="Deze week">Vandaag</button>
          <button className="ws-btn" onClick={gotoNextWeek} title="Volgende week">▶</button>
          <span className="ws-weeklabel">{weekLabel}</span>
        </div>
      </aside>

      {/* ------- Weekschema (rechts) ------- */}
      <section>
        {/* Dagkoppen */}
        <div className="ws-days-grid">
          {SAFE_DAY_IDS.map((dayId, i) => (
            <div key={dayId} className="ws-day-head">
              <div className="ws-day-name">{dayLabels[i]}</div>
            </div>
          ))}
        </div>

        {/* Rijen per blok */}
        {SAFE_BLOCKS.map((blk) => (
          <div key={blk.id} className="ws-block-row">
            <div className="ws-days-grid">
              {SAFE_DAY_IDS.map((dayId, idx) => {
                const cellTasks = assignments?.[dayId]?.[blk.id] ?? [];
                return (
                  <div
                    key={`${dayId}_${blk.id}`}
                    className="ws-dropzone"
                    data-block={blk.id}
                    data-day={dayId}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDropToCell(e, dayId, blk.id)}
                  >
                    <div className="ws-block-caption">{labelFor(blk.id, idx, blk.label)}</div>
                    <div className="ws-chip-wrap">
                      {Array.isArray(cellTasks) && cellTasks.map((taskId) => {
                        const t = SAFE_LIB_BY_ID[taskId];
                        if (!t) return null;
                        return (
                          <div
                            key={taskId}
                            className="ws-task-chip"
                            draggable
                            onDragStart={(e) => onDragFromCell(e, taskId, { dayId, blockId: blk.id })}
                            title="Sleep of verwijder met ×"
                          >
                            {t.icon ? <span className="ws-chip-icon" aria-hidden>{t.icon}</span> : <span className="ws-chip-dot" />}
                            <span className="ws-chip-text">{t.title}</span>
                            <button
                              type="button"
                              className="ws-chip-remove"
                              aria-label="Verwijder taak"
                              onClick={() => removeTask?.(dayId, blk.id, taskId)}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
