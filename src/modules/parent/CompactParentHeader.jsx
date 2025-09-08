// src/modules/parent/CompactParentHeader.jsx
import React, { useMemo, useState } from "react";

/**
 * CompactParentHeader
 * - Chip "Admin" + tip "FamID: X · Firestore: <status>" op dezelfde lijn
 * - Rij gebruikerskaarten (alleen kinderen klikbaar)
 * - forceAdminActive: op Home Papa highlighten i.p.v. currentUserId
 *
 * Props:
 *  users: Array<{ id, name, role, avatar? }>
 *  currentUserId?: string
 *  onFocusUser?: (id: string) => void
 *  famId?: string
 *  isFirestoreReady?: boolean | undefined
 *  forceAdminActive?: boolean (default true)
 */
export default function CompactParentHeader({
  users = [],
  currentUserId,
  onFocusUser,
  famId,
  isFirestoreReady,
  forceAdminActive = true,
}) {
  const list = Array.isArray(users) ? users : [];

  const adminUser = useMemo(
    () => list.find((u) => (u.role || "").toLowerCase() === "ouder"),
    [list]
  );

  const displayActiveId =
    forceAdminActive && adminUser ? adminUser.id : currentUserId;

  const fsLabel =
    isFirestoreReady === true
      ? "verbonden"
      : isFirestoreReady === false
      ? "niet verbonden"
      : "onbekend";

  const initialsOf = (name = "") =>
    name
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  /** Avatar: toon initialen enkel als er geen/kapotte image is */
  function Avatar({ src, name }) {
    const [showInitials, setShowInitials] = useState(!src);

    return (
      <div className="ph-user-avatar">
        {showInitials && (
          <span className="ph-user-initials">{initialsOf(name)}</span>
        )}
        {src ? (
          <img
            className="ph-user-img"
            src={src}
            alt=""
            draggable={false}
            onLoad={() => setShowInitials(false)}
            onError={(e) => {
              setShowInitials(true);
              e.currentTarget.style.display = "none"; // verberg kapotte img
            }}
          />
        ) : null}
      </div>
    );
  }

  const isKid = (u) => (u.role || "").toLowerCase() === "kind";

  return (
    <div className="ph-card parent-header">
      {/* Headbar in dezelfde stijl als 'Menu' */}
      <div className="ph-headbar" style={{ justifyContent: "flex-start" }}>
        <span className="ph-chip">Admin</span>
        <span className="ph-tip-inline">
          FamID: {famId ?? "—"} · Firestore: {fsLabel}
        </span>
      </div>

      <div className="ph-card-body ph-card-body--tight">
        <div className="ph-userlist">
          {list.map((u) => {
            const active = u.id === displayActiveId;
            const selectable = isKid(u);
            return (
              <button
                key={u.id}
                type="button"
                className={[
                  "ph-usercard",
                  active ? "is-active" : "",
                  selectable ? "" : "is-disabled",
                ].join(" ")}
                onClick={() => selectable && onFocusUser?.(u.id)}
                aria-pressed={active ? "true" : "false"}
                aria-label={`${u.name} – ${u.role}`}
                title={
                  selectable
                    ? `${u.name} selecteren`
                    : `${u.name} (niet selecteerbaar)`
                }
              >
                <Avatar src={u.avatar} name={u.name} />
                <div className="ph-user-meta">
                  <div className="ph-user-name">{u.name}</div>
                  <div className="ph-user-role">{u.role}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
