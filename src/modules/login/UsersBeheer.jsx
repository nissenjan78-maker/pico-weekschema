// src/modules/login/UsersBeheer.jsx
import React, { useState } from "react";

/**
 * Props:
 *  - users
 *  - onSave(usersNext)
 *  - onBack()
 */
export default function UsersBeheer({ users = [], onSave, onBack }) {
  const [rows, setRows] = useState(users);

  function update(i, patch) { setRows(r => r.map((x,idx)=> idx===i ? {...x, ...patch} : x)); }
  function add() { setRows(r => [...r, { id:`u_${Math.random().toString(36).slice(2)}`, name:"Nieuw", role:"kind", avatar:"/avatars/Leon.png" }]); }
  function remove(i) { setRows(r => r.filter((_,idx)=>idx!==i)); }

  return (
    <div style={{ maxWidth: 900, margin:"24px auto", padding:16, background:"#fff", border:"1px solid #e5e7eb", borderRadius:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ fontWeight:800, fontSize:20 }}>Gebruikersbeheer</div>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button onClick={add} style={{ padding:"8px 12px", borderRadius:10, border:"1px solid #e5e7eb", background:"#f9fafb", cursor:"pointer" }}>+ Gebruiker</button>
          <button onClick={()=>onSave(rows)} style={{ padding:"8px 12px", borderRadius:10, border:"1px solid #e5e7eb", background:"#e0f2fe", cursor:"pointer" }}>Bewaren</button>
          <button onClick={onBack} style={{ padding:"8px 12px", borderRadius:10, border:"1px solid #e5e7eb", background:"#f3f4f6", cursor:"pointer" }}>Terug</button>
        </div>
      </div>

      <div style={{ display:"grid", gap:12, marginTop:12 }}>
        {rows.map((u, i)=>(
          <div key={u.id} style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:8, alignItems:"center" }}>
              <label style={{ display:"grid", gap:6, fontSize:13 }}>
                Naam
                <input value={u.name} onChange={(e)=>update(i,{name:e.target.value})}
                       style={{ padding:"8px 10px", borderRadius:10, border:"1px solid #e5e7eb" }}/>
              </label>
              <label style={{ display:"grid", gap:6, fontSize:13 }}>
                Rol
                <select value={u.role} onChange={(e)=>update(i,{role:e.target.value})}
                        style={{ padding:"8px 10px", borderRadius:10, border:"1px solid #e5e7eb" }}>
                  <option value="kind">kind</option>
                  <option value="ouder">ouder</option>
                </select>
              </label>
              <label style={{ display:"grid", gap:6, fontSize:13 }}>
                Avatar (pad)
                <input value={u.avatar||""} onChange={(e)=>update(i,{avatar:e.target.value})}
                       placeholder="/avatars/Papa.png"
                       style={{ padding:"8px 10px", borderRadius:10, border:"1px solid #e5e7eb" }}/>
              </label>
              <button onClick={()=>remove(i)}
                      style={{ padding:"8px 12px", borderRadius:10, border:"1px solid #e5e7eb", background:"#fee2e2", cursor:"pointer" }}>
                Verwijderen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
