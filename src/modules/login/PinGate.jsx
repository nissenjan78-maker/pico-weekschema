// src/modules/login/PinGate.jsx
import React, { useState } from "react";
import { useAuth } from "../../lib/AuthProvider";

export default function PinGate({ children }) {
  const { parentAuthed, loginParent, family } = useAuth();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  if (parentAuthed) return children;

  return (
    <div style={card}>
      <div style={legend}>Ouder-modus vergrendeld</div>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ color: "#6b7280" }}>
          Voer de ouder-pincode in om de ouder-module te openen.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={pin}
            onChange={(e) => { setPin(e.target.value); setErr(""); }}
            type="password"
            placeholder="****"
            inputMode="numeric"
            style={input}
          />
          <button
            style={btnPrimary}
            onClick={() => {
              if (!loginParent(pin)) setErr("Pincode onjuist.");
            }}
          >
            Ontgrendel
          </button>
        </div>
        {err && <div style={{ color: "#ef4444", fontSize: 13 }}>{err}</div>}
        <div style={{ color: "#9ca3af", fontSize: 12 }}>
          Familie-ID: <strong>{family.famId}</strong>
        </div>
      </div>
    </div>
  );
}

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
const input = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #d4d4d8",
  width: 120,
  fontSize: 16,
  letterSpacing: 4,
  textAlign: "center",
};
const btnPrimary = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #93c5fd",
  background: "#3b82f6",
  color: "white",
  cursor: "pointer",
};
