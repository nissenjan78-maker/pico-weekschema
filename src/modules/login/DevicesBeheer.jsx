// src/modules/login/DevicesBeheer.jsx
import React, { useMemo, useState } from "react";
import { useDeviceBinding } from "../../lib/useDeviceBinding";

/**
 * Props:
 *  - users: array [{id,name,role,avatar,...}]
 *  - onBack: () => void
 */
export default function DevicesBeheer({ users = [], onBack }) {
  const { deviceId, allBindings, reassignDevice, unbindDevice } = useDeviceBinding();
  const usersMap = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);
  const [selection, setSelection] = useState({}); // deviceId -> userId

  const sorted = [...allBindings].sort((a,b)=>String(a.userName||"").localeCompare(String(b.userName||"")));

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16, border: "1px solid #e5e7eb", background: "#fff", borderRadius: 16 }}>
      <div style={{ display: "flex", alignItems:"center", gap:12 }}>
        <div style={{ fontWeight: 800, fontSize: 20 }}>Device-koppelingen</div>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={onBack} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f3f4f6", cursor:"pointer" }}>Terug</button>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 13, color:"#6b7280" }}>Huidig toestel: <b>{deviceId}</b></div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {sorted.map((b) => {
          const u = usersMap[b.userId];
          return (
            <div key={b.deviceId} style={{ border:"1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <div style={{ display:"flex", gap: 8, alignItems:"center" }}>
                <div style={{ fontWeight: 800 }}>{u?.name || b.userName || "(geen naam)"}</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>{b.role || (u?.role ?? "")} • {b.deviceId}</div>
                <div style={{ marginLeft: "auto", display:"flex", gap: 8 }}>
                  <select
                    value={selection[b.deviceId] || ""}
                    onChange={(e)=>setSelection(s=>({ ...s, [b.deviceId]: e.target.value }))}
                    style={{ padding:"6px 8px", borderRadius: 10, border:"1px solid #e5e7eb" }}
                  >
                    <option value="">Koppel aan…</option>
                    {users.map((x)=>(
                      <option key={x.id} value={x.id}>{x.name} • {x.role}</option>
                    ))}
                  </select>
                  <button
                    onClick={async ()=>{
                      const sel = selection[b.deviceId];
                      if (!sel) return;
                      await reassignDevice(b.deviceId, usersMap[sel]);
                      alert("Koppeling bijgewerkt");
                    }}
                    style={{ padding:"6px 10px", borderRadius: 10, border:"1px solid #e5e7eb", background:"#eef2ff", cursor:"pointer" }}
                  >
                    Toepassen
                  </button>
                  <button
                    onClick={async ()=>{
                      if (!confirm("Koppeling verwijderen?")) return;
                      await unbindDevice(b.deviceId);
                      alert("Device verwijderd");
                    }}
                    style={{ padding:"6px 10px", borderRadius: 10, border:"1px solid #e5e7eb", background:"#fee2e2", cursor:"pointer" }}
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
              <div style={{ fontSize:12, color:"#6b7280", marginTop: 6, wordBreak:"break-all" }}>{b.ua}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
