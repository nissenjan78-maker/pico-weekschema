// src/modules/parent/panels/LibraryPanel.jsx
import React from "react";

const LIB_ITEMS = [
  {
    id: "aankleden",
    label: "Aankleden",
    picto: "/pictos/Aankleden.png", // <- zorg dat dit pad klopt met jouw public/pictos
    text: "Aankleden",
  },
  // hier kun je straks makkelijk uitbreiden
];

export default function LibraryPanel() {
  return (
    <div className="lib-wrap">
      <div className="lib-list">
        {LIB_ITEMS.map((it) => (
          <button key={it.id} className="lib-item" type="button">
            <div className="lib-picto">
              <img src={it.picto} alt={it.label} />
            </div>
            <div className="lib-label">{it.label}</div>
          </button>
        ))}
      </div>

      <style>{`
        .lib-wrap { width:100%; }
        .lib-list {
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
        }
        .lib-item {
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap: 10px;
          padding: 14px 12px;
          border:1px solid #e5e7eb;
          border-radius:16px;
          background:#fff;
          transition: transform .06s ease, box-shadow .06s ease;
        }
        .lib-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        .lib-picto {
          width:64px; height:64px;
          border-radius:12px;
          background:#f3f4f6;
          display:flex; align-items:center; justify-content:center;
          overflow:hidden;
        }
        .lib-picto img { width:100%; height:100%; object-fit:contain; }
        .lib-label { font-weight:700; }
      `}</style>
    </div>
  );
}
