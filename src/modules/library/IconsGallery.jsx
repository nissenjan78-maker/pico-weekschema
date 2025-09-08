import React, { useMemo, useState } from "react";
import icons from "./manifests/icons.json";
import ImageTile from "./ImageTile";

/**
 * Props:
 *  - value: string | undefined
 *  - onChange: (icon) => void
 */
export default function IconsGallery({ value, onChange }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return icons;
    return icons.filter(i => i.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <section>
      <Header title="Icons" hint="Kleine symbolen voor UI of labels">
        <input
          placeholder="Zoek icon…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={inputStyle}
        />
      </Header>

      <Grid>
        {filtered.map(it => (
          <ImageTile
            key={it.id}
            item={it}
            active={value === it.id || value === it.src}
            onClick={() => onChange?.(it)}
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
  minWidth: 220,
  background: "#fff"
};
