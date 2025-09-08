import React from "react";

/**
 * Kids-header:
 * - Terug-knop (alleen wanneer canGoBack = true)
 * - Avatar – Naam op 1 lijn
 * - Label "Kids-module" gecentreerd
 */
export default function Header_Kids({ user, canGoBack, onBack }) {
  const wrap = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 12,
    background: "rgba(255,255,255,.85)",
    position: "relative",
    marginBottom: 12,
  };
  const legend = {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "2px 10px",
    borderRadius: 9999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 700,
  };
  const row = {
    display: "flex",
    alignItems: "center",
    gap: 12,
  };
  const avatar = {
    width: 56,
    height: 56,
    borderRadius: 12,
    objectFit: "cover",
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    flex: "0 0 56px",
  };

  return (
    <section style={wrap}>
      <div style={legend}>Kids-module</div>

      <div style={{ ...row, justifyContent: "space-between" }}>
        <div style={row}>
          <img
            src={`/avatars/${user?.avatar || "avatar.png"}`}
            alt={user?.name || "Kind"}
            style={avatar}
            onError={(e) => (e.currentTarget.src = "/avatars/avatar.png")}
            draggable={false}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <div style={{ fontWeight: 700 }}>{user?.name || "Kind"}</div>
            <div style={{ color: "#6b7280" }}>{capitalize(user?.role || "kind")}</div>
          </div>
        </div>

        {canGoBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              borderRadius: 12,
              border: "1px solid #d4d4d8",
              padding: "6px 10px",
              background: "#fafafa",
            }}
          >
            ← Terug
          </button>
        )}
      </div>
    </section>
  );
}

function capitalize(s) {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
}
