import React, { useMemo, useState } from "react";
import pictos from "./manifests/pictos.json";
import ImageTile from "./ImageTile";

/**
 * Props:
 *  - value: string | undefined (geselecteerde picto-id of src)
 *  - onPick: (picto) => void                (bv. een taak maken met deze picto)
 */
export default function PictosGallery({ value, onPick }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Alle");

  const categories = useMemo(
    () => ["Alle", ...Array.from(new Set(pictos.map(p => p.category).filter(Boolean)))],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pictos.filter(p => {
      const okQ = !q || p.label.toLowerCase().includes(q);
      const okC = category === "Alle" || p.category === category;
      return okQ && okC;
    });
  }, [query, category]);

  return (
    <section>
      <Header
        title="Pictos"
        hint="Afbeeldingen voor taken in de bibliotheek"
      >
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Zoek picto…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={inputStyle}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={inputStyle}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </Header>

      <Grid>
        {filtered.map(it => (
          <ImageTile
            key={it.id}
            item={it}
            active={value === it.id || value === it.src}
            subtitle={it.category}
            onClick={() => onPick?.(it)}
          />
        ))}
      </Grid>
    </section>
  );
}

function Header({ title, hint, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
        {hint && <div style={{ fontSize: 12, color: "#6b7280" }}>{hint}</div>}
      </div>
      <div style={{ marginLeft: "auto" }}>{children}</div>
    </div>
  );
}
function Grid({ children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: 12
    }}>
      {children}
    </div>
  );
}
const inputStyle = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  minWidth: 180,
  background: "#fff"
};
