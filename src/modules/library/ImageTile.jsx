import React from "react";

export default function ImageTile({ item, active, onClick, subtitle }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      title={item.label}
      style={{
        display: "grid",
        gap: 8,
        justifyItems: "center",
        width: 160,
        padding: 12,
        borderRadius: 14,
        border: active ? "2px solid #2563eb" : "1px solid #e5e7eb",
        background: active ? "#eef2ff" : "#fff",
        cursor: "pointer"
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          background: "#fff",
          display: "grid",
          placeItems: "center"
        }}
      >
        <img
          src={item.src}
          alt={item.label}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          draggable={false}
        />
      </div>
      <div style={{ fontWeight: 700 }}>{item.label}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#6b7280" }}>{subtitle}</div>}
    </button>
  );
}
