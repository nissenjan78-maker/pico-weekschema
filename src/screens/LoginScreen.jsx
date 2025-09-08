// src/screens/LoginScreen.jsx
import React, { useState } from "react";

export default function LoginScreen({ kids, onPickKid, onPickParent, validateParentPin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#f8fafc", padding: 16 }}>
      <div style={{ width: 880, maxWidth: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Wie ben je?</div>
        <div style={{ color: "#6b7280", marginBottom: 16 }}>Kies je profiel op dit toestel.</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {kids.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => onPickKid?.(k.id)}
              style={{
                textAlign: "left",
                display: "grid",
                gap: 8,
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                background: "#f9fafb",
                padding: "14px 16px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 32 }}>👦</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{k.name}</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>Alleen jouw weekschema</div>
            </button>
          ))}

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍🦱</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Ouder</div>
            <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}>Volledige toegang</div>
            <input
              type="password"
              inputMode="numeric"
              placeholder="Pincode"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 8 }}
            />
            {!!error && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 6 }}>{error}</div>}
            <button
              type="button"
              onClick={() => {
                if (!validateParentPin?.(pin)) {
                  setError("PIN onjuist.");
                  return;
                }
                onPickParent?.();
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #1e40af",
                color: "#fff",
                background: "#2563eb",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Inloggen als ouder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
