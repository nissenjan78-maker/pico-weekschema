// src/modules/parent/panels/TextList.jsx
import React from "react";

/**
 * Placeholder: tekstitems (bijv. "Aankleden", "Ontbijt", ...),
 * later gevoed vanuit de bibliotheek-assignments.
 */
export default function TextList({ famId, userId, dayKey }) {
  const items = ["Aankleden", "Ontbijt", "Douch", "Tandenpoetsen"]; // voorbeeld

  return (
    <ul className="txt">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}

      <style>{`
        .txt { margin:0; padding-left:18px; }
        .txt li{ line-height:1.3; }
      `}</style>
    </ul>
  );
}
