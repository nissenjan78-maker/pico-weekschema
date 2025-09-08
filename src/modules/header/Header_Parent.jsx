import React from "react";

/**
 * Parent header
 * - Gebruikers naast elkaar in een horizontale rail (scrollbaar indien nodig)
 * - Avatar – Naam – Rol op 1 regel
 * - Klik op kind => meteen kind-modus
 * - Blauwe rand voor actieve gebruiker
 * - Optioneel titel/legend via prop `showLegend` (default: true)
 */
export default function Header_Parent({
   users = [],
   activeUserId,
   onFocusUser,   // (id) => void
   onOpenChild,   // (id) => void

 showLegend = true,   // << standaard UIT
 }) {
  const kids = users.filter(u => (u.role || "").toLowerCase() === "kind");
  const parents = users.filter(u => (u.role || "").toLowerCase() === "ouder");
  const ordered = [...parents, ...kids];

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
    whiteSpace: "nowrap",
  };
  const rail = {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    whiteSpace: "nowrap",
    paddingBottom: 4,
    scrollbarWidth: "thin",
  };

  return (
    <section style={wrap}>
      {showLegend && <div style={legend}>Ouder-module</div>}
      <div style={rail}>
        {ordered.map((u) => (
          <UserTile
            key={u.id}
            user={u}
            active={u.id === activeUserId}
            onFocusUser={onFocusUser}
            onOpenChild={onOpenChild}
          />
        ))}
      </div>
    </section>
  );
}

function UserTile({ user, active, onFocusUser, onOpenChild }) {
  const isKid = (user.role || "").toLowerCase() === "kind";

  const card = {
    flex: "0 0 320px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    background: "#fff",
    border: active ? "2px solid #3b82f6" : "1px solid #e5e7eb",
    cursor: "pointer",
  };
  const avatar = {
    width: 64,
    height: 64,
    borderRadius: 14,
    objectFit: "cover",
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    flex: "0 0 64px",
  };
  const nameRole = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const handleClick = () => {
    if (isKid) onOpenChild && onOpenChild(user.id);
    else onFocusUser && onFocusUser(user.id);
  };

  return (
    <div style={card} onClick={handleClick}>
      <img
        src={`/avatars/${user.avatar || "avatar.png"}`}
        alt={user.name}
        style={avatar}
        onError={(e) => (e.currentTarget.src = "/avatars/avatar.png")}
        draggable={false}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={nameRole} title={`${user.name} – ${capitalize(user.role)}`}>
          <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{user.name}</span>
          <span aria-hidden>–</span>
          <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{capitalize(user.role)}</span>
        </div>
      </div>
    </div>
  );
}

function capitalize(s) {
  const v = s || "";
  return v.charAt(0).toUpperCase() + v.slice(1);
}
