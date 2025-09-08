// src/modules/parent/panels/UsersPanel.jsx
import React, { useMemo, useState } from "react";
import { useFamily, setPlan } from "../../../data/familyStore";
import { useUsers, createUser, updateUser, deleteUser, getFamilyUsers } from "../../../data/usersStore";

export default function UsersPanel() {
  const family = useFamily();
  const usersAll = useUsers();
  const users = useMemo(() => getFamilyUsers(family.famId), [usersAll, family.famId]);

  const parents = users.filter(u => u.role === "ouder");
  const kids = users.filter(u => u.role === "kind");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <PlanCard family={family} parentsCount={parents.length} kidsCount={kids.length} />

      <div style={card}>
        <div style={legend}>Gebruikers</div>
        <div style={{ display: "grid", gap: 10 }}>
          {users.map(u => <UserRow key={u.id} user={u} />)}
          <div>
            <button style={btnPrimary} onClick={() => {
              try { createUser({ role: "kind" }); }
              catch (e) { alert(e.message); }
            }}>
              + Kind toevoegen
            </button>
            <button style={btnGhost} onClick={() => {
              try { createUser({ role: "ouder" }); }
              catch (e) { alert(e.message); }
            }}>
              + Ouder toevoegen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ family, parentsCount, kidsCount }) {
  const [p, setP] = useState(family.plan.parents);
  const [k, setK] = useState(family.plan.kids);

  return (
    <div style={card}>
      <div style={legend}>Abonnement (Familie {family.famId})</div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>Huidig plan: <b>{family.plan.parents}</b> ouder(s), <b>{family.plan.kids}</b> kind(eren)</div>
        <div style={{ color: "#6b7280" }}>Gebruikt: {parentsCount}/{family.plan.parents} ouders, {kidsCount}/{family.plan.kids} kids</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label>Ouders: <input type="number" min={1} value={p} onChange={(e)=>setP(Number(e.target.value||1))} style={inputTiny}/></label>
        <label>Kinderen: <input type="number" min={0} value={k} onChange={(e)=>setK(Number(e.target.value||0))} style={inputTiny}/></label>
        <button style={btnPrimary} onClick={()=> setPlan({ parents: p, kids: k })}>Plan opslaan</button>
      </div>
    </div>
  );
}

function UserRow({ user }) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [avatar, setAvatar] = useState(user.avatar || "avatar.png");

  const dirty = name !== user.name || role !== user.role || avatar !== (user.avatar || "avatar.png");

  return (
    <div style={row}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <img
          src={`/avatars/${avatar}`}
          onError={(e)=> (e.currentTarget.src="/avatars/avatar.png")}
          alt="avatar"
          style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid #e5e7eb", background:"#f3f4f6" }}
        />
        <input value={name} onChange={(e)=>setName(e.target.value)} style={{ ...input, width: 220 }} />
      </div>

      <select value={role} onChange={(e)=>setRole(e.target.value)} style={{ ...input, width: 140 }}>
        <option value="ouder">Ouder</option>
        <option value="kind">Kind</option>
      </select>

      <input
        value={avatar}
        onChange={(e)=>setAvatar(e.target.value)}
        placeholder="bv. Leon.png"
        style={{ ...input, flex: 1 }}
        list={`avatars_list_${user.id}`}
      />
      {/* optioneel: datalist uit /public/avatars (namen) — hou het simpel, statisch werkt ook */}
      <datalist id={`avatars_list_${user.id}`}>
        <option>Papa.png</option><option>Mama.png</option>
        <option>Leon.png</option><option>Lina.png</option>
        <option>avatar.png</option>
      </datalist>

      <div style={{ display: "flex", gap: 8, justifyContent:"flex-end" }}>
        <button
          style={{ ...btnPrimary, opacity: dirty ? 1 : 0.6 }}
          disabled={!dirty}
          onClick={()=>{
            try { updateUser(user.id, { name, role, avatar }); }
            catch (e) { alert(e.message); }
          }}
        >
          Opslaan
        </button>
        <button
          style={btnDanger}
          onClick={()=>{
            try { deleteUser(user.id); }
            catch (e) { alert(e.message); }
          }}
        >
          Verwijderen
        </button>
      </div>
    </div>
  );
}

/* styles */
const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "rgba(255,255,255,.85)",
  padding: 12,
  position: "relative",
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
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 10,
  display: "grid",
  gridTemplateColumns: "minmax(260px, 340px) 160px 1fr auto",
  gap: 10,
  alignItems: "center",
  background: "#fff",
};
const input = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #d4d4d8",
};
const inputTiny = { ...input, width: 80, textAlign: "center" };
const btnPrimary = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #93c5fd",
  background: "#3b82f6",
  color: "#fff",
  cursor: "pointer",
};
const btnGhost = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #d4d4d8",
  background: "#fafafa",
  cursor: "pointer",
};
const btnDanger = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#ef4444",
  color: "#fff",
  cursor: "pointer",
};
