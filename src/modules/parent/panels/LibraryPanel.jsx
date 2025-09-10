import React, { useEffect, useMemo, useState, useCallback } from "react";

/**
 * Bibliotheek met picto's + tekst.
 * - Opslag: localStorage per householdId -> key: library:<householdId>
 * - Start met 1 item ("Aankleden") wanneer er nog geen data is.
 * - Wijzigt niets aan andere modules.
 */

/* ===== Helper & constants ===== */

const uid = () => Math.random().toString(36).slice(2, 10);

/** Beschikbare pictos in /public/pictos (je kunt deze lijst uitbreiden). */
const PICTO_OPTIONS = [
  { label: "Aankleden", file: "Aankleden.png" },
  { label: "Opstaan", file: "Opstaan.png" },
  { label: "Ontbijt", file: "Ontbijt.png" },
  { label: "Lezen", file: "Lezen.png" },
  { label: "In bad", file: "in bad.png" },
  { label: "Douchen", file: "Douchen.png" },
  { label: "Naar bed gaan", file: "Naar bed gaan.png" },
  { label: "Naar school gaan 2", file: "Naar school gaan 2.png" },
  { label: "Spelen", file: "Spelen 3.png" },
];

/** Bepaal absolute public URL naar picto-file (correcte encoding voor spaties). */
function pictoUrl(file) {
  return `/pictos/${encodeURIComponent(file)}`;
}

/* ===== Hook voor opslag ===== */

function useLibrary(householdId) {
  const storageKey = useMemo(() => `library:${householdId}`, [householdId]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
  }, [storageKey]);

  const save = useCallback(
    (next) => {
      setItems(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
    },
    [storageKey]
  );

  return { items, save };
}

/* ===== Component ===== */

export default function LibraryPanel({ householdId = "default" }) {
  const { items, save } = useLibrary(householdId);

  // seed 1 start-item ("Aankleden") als de bib leeg is
  useEffect(() => {
    if (!items || items.length === 0) {
      const seed = [
        {
          id: uid(),
          type: "picto",      // of "text"
          title: "Aankleden", // label
          text: "Aankleden",  // tekstvoorlees/print fallback
          picto: "Aankleden.png",
        },
      ];
      save(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // enkel bij eerste mount

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // item of null
  const [showForm, setShowForm] = useState(false);

  // eenvoudige filter (titel, tekst)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        (i.title || "").toLowerCase().includes(q) ||
        (i.text || "").toLowerCase().includes(q) ||
        (i.picto || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  /* ===== CRUD ===== */

  function startCreate() {
    setEditing({
      id: uid(),
      type: "picto",
      title: "",
      text: "",
      picto: "Aankleden.png",
    });
    setShowForm(true);
  }
  function startEdit(item) {
    setEditing({ ...item });
    setShowForm(true);
  }
  function cancelForm() {
    setEditing(null);
    setShowForm(false);
  }
  function commitForm() {
    if (!editing) return;
    const exists = items.some((it) => it.id === editing.id);
    const next = exists
      ? items.map((it) => (it.id === editing.id ? editing : it))
      : [...items, editing];
    save(next);
    setEditing(null);
    setShowForm(false);
  }
  function removeItem(id) {
    if (!window.confirm("Verwijderen?")) return;
    save(items.filter((i) => i.id !== id));
  }
  function move(id, dir) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const to = idx + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [row] = next.splice(idx, 1);
    next.splice(to, 0, row);
    save(next);
  }

  return (
    <div className="lib-wrap">
      {/* Toolbar */}
      <div className="lib-toolbar">
        <div className="lib-left">
          <input
            className="lib-input"
            placeholder="Zoeken…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="lib-right">
          <button className="btn" onClick={startCreate}>
            + Nieuw item
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="lib-grid">
        {filtered.map((it) => (
          <div className="lib-card" key={it.id}>
            <div className="lib-thumb">
              {it.type === "picto" ? (
                <img
                  src={pictoUrl(it.picto || "Aankleden.png")}
                  alt={it.title || "Picto"}
                  onError={(e) => {
                    e.currentTarget.src = pictoUrl("Aankleden.png");
                  }}
                />
              ) : (
                <div className="lib-text-thumb">{it.text || it.title || "Tekst"}</div>
              )}
            </div>
            <div className="lib-title">
              {it.type === "picto" ? "Picto – " : "Tekst – "}
              {it.title || "Zonder titel"}
            </div>

            <div className="lib-actions">
              <button className="btn subtle" onClick={() => move(it.id, -1)}>↑</button>
              <button className="btn subtle" onClick={() => move(it.id, +1)}>↓</button>
              <span style={{ flex: 1 }} />
              <button className="btn" onClick={() => startEdit(it)}>Bewerken</button>
              <button className="btn danger" onClick={() => removeItem(it.id)}>Verwijder</button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="lib-empty">Nog geen items… Klik op “+ Nieuw item”.</div>
        )}
      </div>

      {/* Form */}
      {showForm && editing && (
        <div className="lib-modal">
          <div className="lib-modal-card">
            <div className="lib-formrow">
              <label className="lib-label">Type</label>
              <select
                className="lib-input"
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value })}
              >
                <option value="picto">Picto (afbeelding)</option>
                <option value="text">Tekst</option>
              </select>
            </div>

            <div className="lib-formrow">
              <label className="lib-label">Titel</label>
              <input
                className="lib-input"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Aankleden"
              />
            </div>

            {editing.type === "picto" ? (
              <>
                <div className="lib-formrow">
                  <label className="lib-label">Picto</label>
                  <select
                    className="lib-input"
                    value={editing.picto}
                    onChange={(e) => setEditing({ ...editing, picto: e.target.value })}
                  >
                    {PICTO_OPTIONS.map((p) => (
                      <option key={p.file} value={p.file}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="lib-formrow">
                  <label className="lib-label">Voorbeeld</label>
                  <img
                    src={pictoUrl(editing.picto || "Aankleden.png")}
                    alt="preview"
                    style={{ width: 80, height: 80, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                </div>
              </>
            ) : (
              <div className="lib-formrow">
                <label className="lib-label">Tekst</label>
                <input
                  className="lib-input"
                  value={editing.text}
                  onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                  placeholder="Aankleden"
                />
              </div>
            )}

            <div className="lib-modal-actions">
              <button className="btn" onClick={commitForm}>Opslaan</button>
              <button className="btn subtle" onClick={cancelForm}>Annuleren</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn{ padding:6px 10px; border:1px solid #e5e7eb; background:#fff; border-radius:10px; font-weight:600; cursor:pointer; }
        .btn.subtle{ background:#fff; }
        .btn.danger{ background:#fff0f0; border-color:#f3c1c1; }
        .lib-wrap{ display:flex; flex-direction:column; gap:12px; }
        .lib-toolbar{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
        .lib-left{ display:flex; align-items:center; gap:8px; }
        .lib-input{ height:36px; border:1px solid #e5e7eb; border-radius:10px; padding:0 10px; min-width:260px; }
        .lib-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; }
        .lib-card{ border:1px solid #e5e7eb; border-radius:14px; padding:10px; background:#fff; display:flex; flex-direction:column; gap:8px; }
        .lib-thumb{ width:100%; aspect-ratio:1/1; border:1px solid #e5e7eb; border-radius:12px; background:#f8fafc; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .lib-thumb img{ width:100%; height:100%; object-fit:cover; }
        .lib-text-thumb{ font-weight:800; color:#111; }
        .lib-title{ font-weight:800; }
        .lib-actions{ display:flex; align-items:center; gap:6px; }
        .lib-empty{ grid-column:1/-1; text-align:center; color:#6b7280; font-style:italic; padding:20px 0; }
        .lib-modal{ position:fixed; inset:0; background:rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; z-index:50; }
        .lib-modal-card{ width:min(520px,92vw); background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:12px; }
        .lib-formrow{ display:flex; align-items:center; gap:10px; }
        .lib-label{ width:140px; color:#6b7280; }
        .lib-modal-actions{ display:flex; gap:8px; justify-content:flex-end; padding-top:4px; }
      `}</style>
    </div>
  );
}
