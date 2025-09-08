// src/modules/parent/panels/DevicesPanel.jsx
import React, { useMemo, useState } from "react";
import { useFamily } from "../../../data/familyStore";
import { useUsers, getFamilyUsers } from "../../../data/usersStore";
import { useDeviceBinding } from "../../../lib/useDeviceBinding";
import { removeDevice, upsertDevice } from "../../../data/devicesStore";

export default function DevicesPanel() {
  const family = useFamily();
  const usersAll = useUsers();
  const users = useMemo(() => getFamilyUsers(family.famId), [usersAll, family.famId]);

  const {
    deviceId,
    currentDevice,
    familyDevices,
    setCurrentLabel,
    setCurrentRole,
    setCurrentUser,
    setCurrentForceKidMode,
  } = useDeviceBinding();

  // Local state voor "dit apparaat"
  const [label, setLabel] = useState(currentDevice?.label || "");
  const [role, setRole] = useState(currentDevice?.role || "ouder");
  const [userId, setUserId] = useState(currentDevice?.userId || "");
  const [forceKid, setForceKid] = useState(!!currentDevice?.forceKidMode);

  React.useEffect(() => {
    setLabel(currentDevice?.label || "");
    setRole(currentDevice?.role || "ouder");
    setUserId(currentDevice?.userId || "");
    setForceKid(!!currentDevice?.forceKidMode);
  }, [currentDevice?.label, currentDevice?.role, currentDevice?.userId, currentDevice?.forceKidMode]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Dit apparaat */}
      <section style={card}>
        <div style={legend}>Dit apparaat</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={row}>
            <label>
              <div style={labelStyle}>Naam</div>
              <input
                value={label}
                onChange={(e)=>setLabel(e.target.value)}
                style={input}
                placeholder="bv. Papa’s laptop / Lina’s tablet"
              />
            </label>

            <label>
              <div style={labelStyle}>Rol</div>
              <select value={role} onChange={(e)=>setRole(e.target.value)} style={input}>
                <option value="ouder">Ouder</option>
                <option value="kind">Kind</option>
              </select>
            </label>

            <label>
              <div style={labelStyle}>Koppelen aan gebruiker</div>
              <select
                value={userId}
                onChange={(e)=>setUserId(e.target.value)}
                style={input}
              >
                <option value="">— geen —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id} title={`ID: ${u.id}`}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input
                type="checkbox"
                checked={forceKid}
                onChange={(e)=>setForceKid(e.target.checked)}
              />
              <span>Altijd kindmodus opstarten</span>
            </label>

            <div />
            <div style={{ justifySelf: "end", display:"flex", gap:8 }}>
              <button
                style={btnPrimary}
                onClick={()=>{
                  setCurrentLabel(label);
                  setCurrentRole(role);
                  setCurrentUser(userId || undefined);
                  setCurrentForceKidMode(forceKid);
                }}
              >
                Opslaan
              </button>
            </div>
          </div>

          <div style={{ color:"#9ca3af", fontSize:12 }}>
            Device ID: <code>{deviceId}</code> — platform: <code>{currentDevice?.platform||"?"}</code>
          </div>
        </div>
      </section>

      {/* Familie-apparaten */}
      <section style={card}>
        <div style={legend}>Familie-apparaten</div>
        <div style={{ display: "grid", gap: 8 }}>
          {familyDevices.length === 0 && (
            <div style={{ color: "#6b7280" }}>Geen apparaten in deze familie.</div>
          )}

          {familyDevices.map((d) => (
            <div key={d.deviceId} style={deviceRow}>
              <div style={{ display:"grid", gap:6 }}>
                <div style={{ fontWeight:700 }}>
                  {d.label || "Apparaat"}{" "}
                  {d.deviceId === deviceId && <span style={{ color:"#3b82f6" }}>(dit apparaat)</span>}
                </div>

                <div style={{ color:"#6b7280", fontSize:13 }}>
                  {d.role}{" "}
                  {d.userId ? `• gekoppeld aan ${users.find(u=>u.id===d.userId)?.name || d.userId}` : "• niet gekoppeld"}
                  {d.forceKidMode ? " • forceer kindmodus" : ""}
                </div>

                {/* Nieuwe: directe koppel/ontkoppel via dropdown */}
                <div style={{ display:"grid", gridTemplateColumns:"minmax(240px, 360px) auto", gap:8, alignItems:"center" }}>
                  <select
                    value={d.userId || ""}
                    onChange={(e)=>{
                      const newUid = e.target.value || undefined;
                      upsertDevice({ ...d, userId: newUid });
                    }}
                    style={input}
                    title={d.userId ? `Gekoppeld aan ID: ${d.userId}` : "Niet gekoppeld"}
                  >
                    <option value="">— geen —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id} title={`ID: ${u.id}`}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>

                  <div style={{ color:"#9ca3af", fontSize:12 }}>
                    Laatst gezien: {formatAgo(d.lastSeen)} • platform: {d.platform || "?"}
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <button
                  style={btnGhost}
                  onClick={()=>{
                    const label = prompt("Nieuwe naam voor dit apparaat:", d.label || "Apparaat");
                    if (label == null) return;
                    upsertDevice({ ...d, label });
                  }}
                >
                  Hernoem
                </button>

                <button
                  style={btnDanger}
                  onClick={()=>{
                    if (!confirm("Apparaat verwijderen uit familielijst?")) return;
                    // “Dit apparaat” verschijnt bij volgende boot gewoon weer (ensureCurrentDevice)
                    removeDevice(d.deviceId);
                  }}
                >
                  Verwijder
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* helpers */
function formatAgo(ts) {
  if (!ts) return "onbekend";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s geleden`;
  const m = Math.floor(s/60);
  if (m < 60) return `${m}m geleden`;
  const h = Math.floor(m/60);
  if (h < 48) return `${h}u geleden`;
  const d = Math.floor(h/24);
  return `${d}d geleden`;
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
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) 160px 260px auto auto",
  gap: 10,
  alignItems: "center",
};
const input = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #d4d4d8",
  width: "100%",
};
const labelStyle = { color: "#6b7280", fontSize: 13, marginBottom: 4 };
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
const deviceRow = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 10,
  alignItems: "center",
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 12,
  padding: 10,
};
