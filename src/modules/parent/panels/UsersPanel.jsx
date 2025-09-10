// src/modules/parent/UsersPanel.jsx
import React, { useState } from "react";
import { createUser, updateUser, removeUser } from "../../../lib/tenantApi";

export default function UsersPanel({ famId, users, onUsersChanged }) {
  const [draft, setDraft] = useState({
    id: "",
    displayName: "",
    role: "kind",
    avatar: "",
    pictoOnly: false,
  });

  const up = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const handleCreate = async () => {
    const id = draft.id.trim().toLowerCase();
    if (!id) return;
    const data = {
      displayName: draft.displayName || draft.id,
      role: draft.role || "kind",
      avatar: draft.avatar || "",
      pictoOnly: !!draft.pictoOnly,
      createdAt: new Date(),
    };
    await createUser(famId, id, data);
    onUsersChanged((prev) => [...prev.filter((u) => u.id !== id), { id, ...data }]);
    setDraft({ id: "", displayName: "", role: "kind", avatar: "", pictoOnly: false });
  };

  const handleUpdate = async (u, patch) => {
    await updateUser(famId, u.id, patch);
    onUsersChanged((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...patch } : x)));
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Verwijder ${u.displayName}?`)) return;
    await removeUser(famId, u.id);
    onUsersChanged((prev) => prev.filter((x) => x.id !== u.id));
  };

  return (
    <div className="users">
      <div className="add">
        <h4>Nieuwe gebruiker</h4>
        <div className="row">
          <input placeholder="id (bv. lina)" value={draft.id} onChange={(e) => up("id", e.target.value)} />
          <input placeholder="Naam" value={draft.displayName} onChange={(e) => up("displayName", e.target.value)} />
          <select value={draft.role} onChange={(e) => up("role", e.target.value)}>
            <option value="ouder">Ouder</option>
            <option value="kind">Kind</option>
          </select>
          <input placeholder="Avatar pad (bv. /avatars/Lina.png)" value={draft.avatar} onChange={(e) => up("avatar", e.target.value)} />
          <label style={{display:'flex', alignItems:'center', gap:6}}>
            <input type="checkbox" checked={draft.pictoOnly} onChange={(e) => up("pictoOnly", e.target.checked)} />
            Alleen pictogrammen
          </label>
          <button onClick={handleCreate}>Toevoegen</button>
        </div>
      </div>

      <h4 style={{marginTop:20}}>Gebruikers</h4>
      <div className="list">
        {users.map((u) => (
          <div key={u.id} className="card">
            <div className="left">
              {u.avatar ? <img src={u.avatar} alt="" /> : <div className="avatarFallback">👤</div>}
              <div>
                <div className="name">{u.displayName || u.id}</div>
                <div className="role">{u.role}</div>
              </div>
            </div>
            <div className="right">
              <label style={{display:'flex', alignItems:'center', gap:6}}>
                <input
                  type="checkbox"
                  checked={!!u.pictoOnly}
                  onChange={(e) => handleUpdate(u, { pictoOnly: e.target.checked })}
                />
                Alleen pictogrammen
              </label>
              <button onClick={() => handleDelete(u)}>Verwijder</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .users .row { display:grid; grid-template-columns: 140px 1fr 120px 1fr 180px auto; gap:8px; align-items:center; }
        .users input, .users select { padding:6px 8px; border:1px solid #e5e7eb; border-radius:8px; }
        .list { display:grid; gap:10px; margin-top:10px; }
        .card { border:1px solid #e5e7eb; border-radius:12px; padding:10px; display:flex; justify-content:space-between; align-items:center; }
        .left { display:flex; gap:10px; align-items:center; }
        .left img { width:44px; height:44px; border-radius:10px; object-fit:cover; }
        .avatarFallback { width:44px; height:44px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:#f3f4f6; }
        .name { font-weight:700; }
        .role { color:#6b7280; font-size:12px; }
        .right { display:flex; gap:10px; align-items:center; }
        button{ padding:6px 10px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; cursor:pointer; }
      `}</style>
    </div>
  );
}
