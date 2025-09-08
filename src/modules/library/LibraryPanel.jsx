import React, { useMemo, useState } from "react";
import {
  getTaskLibrary,
  createTask,
  updateTask,
  deleteTask,
  useTaskLibrary,
} from "../../../data/taskLibrary";

/**
 * Takenbibliotheek (inline edit)
 * - Zoeken + filter op schooltaken
 * - Elke rij meteen bewerkbaar (Naam, Picto, Tags)
 * - Opslaan / Verwijderen per rij
 * - Geen interne legend; PanelWrapper toont de titel
 */
export default function LibraryPanel() {
  const tasks = useTaskLibrary();
  const [query, setQuery] = useState("");
  const [onlySchool, setOnlySchool] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesQ =
        !q ||
        t.text.toLowerCase().includes(q) ||
        (t.picto || "").toLowerCase().includes(q) ||
        (t.tags || []).join(" ").toLowerCase().includes(q);
      const matchesSchool = !onlySchool || (t.tags || []).includes("school");
      return matchesQ && matchesSchool;
    });
  }, [tasks, query, onlySchool]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {/* Toolbar */}
      <div style={toolbarCard}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Zoeken op naam, picto of tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={input}
          />
          <label style={pill}>
            <input
              type="checkbox"
              checked={onlySchool}
              onChange={(e) => setOnlySchool(e.target.checked)}
            />{" "}
            alleen schooltaken
          </label>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={btnPrimary}
            onClick={() => {
              createTask({ text: "Nieuwe taak", picto: "", tags: [] });
            }}
          >
            + Nieuwe taak
          </button>
          <button
            style={btnGhost}
            title="Exporteer JSON"
            onClick={() => {
              const blob = new Blob([JSON.stringify(getTaskLibrary(), null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "takenbibliotheek.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Exporteren
          </button>
        </div>
      </div>

      {/* Lijst (inline edit) */}
      <div style={list}>
        {filtered.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: 14 }}>Geen taken gevonden.</div>
        ) : (
          filtered.map((t) => <TaskRow key={t.id} task={t} />)
        )}
      </div>
    </div>
  );
}

/* ───────────── Rijen met inline edit ───────────── */

function TaskRow({ task }) {
  const [form, setForm] = useState({
    text: task.text || "",
    picto: task.picto || "",
    tags: Array.isArray(task.tags) ? task.tags : [],
  });

  const dirty =
    form.text !== (task.text || "") ||
    form.picto !== (task.picto || "") ||
    JSON.stringify(form.tags) !== JSON.stringify(task.tags || []);

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((x) => x !== tag) : [...f.tags, tag],
    }));
  }

  const [newTag, setNewTag] = useState("");

  return (
    <div style={row}>
      {/* Naam + Picto inline */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <PictoThumb picto={form.picto} />
          <input
            type="text"
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            placeholder="Naam (bv. Tanden Poetsen)"
            style={{ ...input, flex: 1 }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>Picto-bestand:</span>
          <input
            type="text"
            value={form.picto}
            onChange={(e) => setForm((f) => ({ ...f, picto: e.target.value }))}
            placeholder='bv. "Tandenpoetsen.png" (uit /pictos/)'
            style={{ ...input, flex: 1 }}
          />
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label style={pill}>
            <input
              type="checkbox"
              checked={form.tags.includes("school")}
              onChange={() => toggleTag("school")}
            />{" "}
            school
          </label>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="nieuwe tag…"
            style={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const t = newTag.trim().toLowerCase();
                if (t && !form.tags.includes(t)) {
                  setForm((f) => ({ ...f, tags: [...f.tags, t] }));
                }
                setNewTag("");
              }
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {form.tags.map((t) => (
            <span key={t} style={chip}>
              {t}
              <button
                title="tag verwijderen"
                onClick={() =>
                  setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))
                }
                style={chipX}
              >
                ×
              </button>
            </span>
          ))}
          {form.tags.length === 0 && (
            <span style={{ color: "#9ca3af", fontSize: 12 }}>(geen tags)</span>
          )}
        </div>
      </div>

      {/* Acties */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
        <button
          style={{ ...btnPrimary, opacity: dirty ? 1 : 0.6 }}
          disabled={!dirty}
          onClick={() =>
            updateTask(task.id, {
              text: (form.text || "").trim() || "Naamloze taak",
              picto: (form.picto || "").trim(),
              tags: form.tags,
            })
          }
        >
          Opslaan
        </button>
        <button
          style={btnDanger}
          onClick={() => {
            if (confirm("Taak verwijderen?")) deleteTask(task.id);
          }}
        >
          Verwijderen
        </button>
      </div>
    </div>
  );
}

/* ───────────── Helpers / styles ───────────── */

function PictoThumb({ picto }) {
  const size = 44;
  const box = {
    width: size,
    height: size,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  };
  if (!picto) return <div style={box} />;
  const src = `/pictos/${picto}`;
  return (
    <div style={box}>
      <img
        src={src}
        alt={picto}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
    </div>
  );
}

const toolbarCard = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "rgba(255,255,255,.85)",
  padding: 10,
};

const list = { display: "grid", gap: 8 };

const row = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.9fr auto",
  alignItems: "center",
  gap: 10,
  padding: 10,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#fff",
};

const input = {
  padding: "6px 10px",
  borderRadius: 12,
  border: "1px solid #d4d4d8",
  background: "rgba(255,255,255,.9)",
  outline: "none",
  fontSize: 14,
};

const pill = {
  padding: "6px 10px",
  borderRadius: 9999,
  border: "1px solid #d4d4d8",
  background: "#fff",
  fontSize: 14,
};

const chip = {
  fontSize: 12,
  padding: "2px 8px",
  borderRadius: 9999,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  display: "inline-flex",
  alignItems: "center",
};

const chipX = {
  marginLeft: 6,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#6b7280",
  fontSize: 13,
};

const btnGhost = {
  padding: "6px 10px",
  borderRadius: 12,
  border: "1px solid #d4d4d8",
  background: "#fafafa",
  cursor: "pointer",
};

const btnPrimary = {
  padding: "6px 10px",
  borderRadius: 12,
  border: "1px solid #93c5fd",
  background: "#3b82f6",
  color: "white",
  cursor: "pointer",
};

const btnDanger = {
  padding: "6px 10px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#ef4444",
  color: "white",
  cursor: "pointer",
};
