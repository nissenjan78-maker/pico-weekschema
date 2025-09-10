import React from "react";

/**
 * Compacte kop met de gezinsleden; de actieve krijgt een blauwe ring.
 */
export default function CompactParentHeader({
  users,
  currentUserId,
  onFocusUser,
}) {
  return (
    <div className="cph">
      {users.map((u) => {
        const active = u.id === currentUserId;
        return (
          <button
            key={u.id}
            className={`cph-card ${active ? "is-active" : ""}`}
            onClick={() => onFocusUser?.(u.id)}
            type="button"
          >
            <div className="cph-avatar">
              <img
                src={u.avatar}
                alt=""
                onError={(e)=> (e.currentTarget.style.visibility="hidden")}
              />
            </div>
            <div className="cph-meta">
              <div className="cph-name">{u.name}</div>
              <div className="cph-role">{u.role}</div>
            </div>
          </button>
        );
      })}

      <style>{`
        .cph{ display:flex; gap:14px; flex-wrap:wrap; }
        .cph-card{
          display:flex; align-items:center; gap:10px;
          border:1px solid #e5e7eb; background:#fff; border-radius:16px;
          padding:10px 12px; cursor:pointer;
        }
        .cph-card.is-active{ outline:3px solid #c7e3ff; }
        .cph-avatar img{
          width:48px; height:48px; border-radius:12px; object-fit:cover;
        }
        .cph-name{ font-weight:800; }
        .cph-role{ color:#6b7280; }
      `}</style>
    </div>
  );
}
