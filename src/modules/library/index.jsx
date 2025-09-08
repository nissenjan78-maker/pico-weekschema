// src/modules/library/index.jsx
import React from "react";
import './index.css';

/**
 * Demo-collecties. In productie kun je hier uit Firestore lezen of
 * een index-bestand genereren met alle bestanden in /public.
 */
const AVATARS = [
  "/avatars/Papa.png", "/avatars/Leon.png", "/avatars/Lina.png", "/avatars/Aria.png"
];
const PICTOS = [
  "/pictos/Aankleden.png", "/pictos/inbad.png", "/pictos/lezen.png", "/pictos/slapen.png", "/pictos/tandenpoetsen.png"
];
const ICONS  = [
  "/icons/moon.svg", "/icons/sun.svg"
];

export function LibraryPanel({ onPickAvatar, onPickPicto, onPickIcon, onBack }) {
  return (
    <div style={{ maxWidth:1100, margin:"24px auto", padding:16, border:"1px solid #e5e7eb", background:"#fff", borderRadius:16 }}>
      <div style={{ display:"flex", alignItems:"center" }}>
        <div style={{ fontWeight:800, fontSize:20 }}>Bibliotheek</div>
        <button onClick={onBack}
                style={{ marginLeft:"auto", padding:"8px 12px", borderRadius:10, border:"1px solid #e5e7eb", background:"#f3f4f6", cursor:"pointer" }}>
          Terug
        </button>
      </div>

      <Section title="Avatars">
        <Grid>
          {AVATARS.map((p)=>(
            <Tile key={p} label={p.split("/").pop()} img={p} onClick={()=>onPickAvatar?.(p)} />
          ))}
        </Grid>
      </Section>

      <Section title="Pictos">
        <Grid>
          {PICTOS.map((p)=>(
            <Tile key={p} label={p.split("/").pop()} img={p} onClick={()=>onPickPicto?.(p)} />
          ))}
        </Grid>
      </Section>

      <Section title="Icons">
        <Grid>
          {ICONS.map((p)=>(
            <Tile key={p} label={p.split("/").pop()} img={p} onClick={()=>onPickIcon?.(p)} />
          ))}
        </Grid>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop:16 }}>
      <div style={{ fontWeight:800, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
}
function Grid({ children }) {
  return <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>{children}</div>;
}
function Tile({ img, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ display:"grid", gap:8, padding:10, borderRadius:12, border:"1px solid #e5e7eb", background:"#f9fafb", cursor:"pointer", textAlign:"left" }}
    >
      <div style={{ width:"100%", aspectRatio:"1/1", borderRadius:8, overflow:"hidden", background:"#fff", display:"grid", placeItems:"center" }}>
        <img src={img} alt={label} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
      </div>
      <div style={{ fontSize:12, color:"#6b7280" }}>{label}</div>
    </button>
  );
}
