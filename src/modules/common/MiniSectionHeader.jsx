import React from "react";

export default function MiniSectionHeader({ title, right }) {
  return (
    <div className="msh">
      <div className="msh-left">{title}</div>
      <div className="msh-right">{right}</div>
      <style>{`
        .msh{
          display:flex; align-items:center; justify-content:space-between;
          gap:10px; padding:6px 0 12px 0;
        }
        .msh-left{ font-weight:800; }
        .msh-right{ display:flex; align-items:center; gap:8px; }
      `}</style>
    </div>
  );
}
