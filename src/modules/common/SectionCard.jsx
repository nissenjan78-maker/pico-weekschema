// src/modules/common/SectionCard.jsx
import React from "react";

export default function SectionCard({ title, metaLeft, metaRight, right, children }) {
  return (
    <div className="scard">
      <div className="scard-head">
        <div className="scard-left">
          <span className="pill">{title}</span>
          {metaLeft && (
            <span className="meta">
              {metaLeft.label}: <strong>{metaLeft.value}</strong>
            </span>
          )}
        </div>
        <div className="scard-right">
          {metaRight && (
            <span className="meta">
              {metaRight.label}: <strong>{metaRight.value}</strong>
            </span>
          )}
          {right && <div className="scard-actions">{right}</div>}
        </div>
      </div>
      <div className="scard-body">{children}</div>

      <style>{`
        .scard{
          width:100%;
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:18px;
          padding:12px;
        }
        .scard-head{
          display:flex; align-items:center; justify-content:space-between;
          gap:12px; margin-bottom:10px;
        }
        .scard-left{ display:flex; align-items:center; gap:14px; }
        .scard-right{ display:flex; align-items:center; gap:14px; }
        .pill{
          display:inline-block; padding:4px 10px; border:1px solid #e5e7eb;
          background:#fff; border-radius:12px; font-weight:800;
        }
        .meta{ color:#6b7280; }
        .meta strong{ color:#111827; }
      `}</style>
    </div>
  );
}
