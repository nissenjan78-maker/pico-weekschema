// src/modules/parent/panels/PictoStrip.jsx
import React from "react";

/**
 * Placeholder: hier toon je pictogrammen (bijv. "Aankleden", "Ontbijt", ...),
 * die je later uit de bibliotheek/assignments haalt voor (famId,userId,dayKey).
 */
export default function PictoStrip({ famId, userId, dayKey }) {
  return (
    <div className="pictos">
      <div className="picto">🧥</div>
      <div className="picto">🍞</div>
      <div className="picto">🚿</div>

      <style>{`
        .pictos{ display:flex; gap:6px; flex-wrap:wrap; }
        .picto{
          width:36px; height:36px; display:flex; align-items:center; justify-content:center;
          border:1px solid #e5e7eb; border-radius:8px; background:#fafafa;
        }
      `}</style>
    </div>
  );
}
