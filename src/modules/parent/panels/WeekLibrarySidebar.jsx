// src/modules/parent/panels/WeekLibrarySidebar.jsx
import React, { useMemo, useState } from "react";

export default function WeekLibrarySidebar({ tasks = [], onAdd }) {
  const [q, setQ] = useState("");
  const [onlySchool, setOnlySchool] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (tasks || []).filter(t => {
      const inSchool = !onlySchool || (t.tags || []).includes("school");
      if (!inSchool) return false;
      if (!needle) return true;
      const hay = `${t.id} ${t.name} ${(t.picto || "")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [q, tasks, onlySchool]);

  function handleDragStart(e, taskId) {
    // geef meerdere mime-types mee voor brede browser support
    e.dataTransfer.setData("text/task-id", taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "copyMove";
  }

  return (
    <aside style={aside}>
      <div style={title}>Bibliotheek</div>

      <input
        value={q}
        onChange={(e)=> setQ(e.target.value)}
        placeholder="Zoeken op naam of id..."
        style={search}
      />

      <label style={{display:"flex", gap:8, alignItems:"center", marginBottom:8}}>
        <input type="checkbox" checked={onlySchool} onChange={(e)=> setOnlySchool(e.target.checked)} />
        <span>Enkel ‘school’-taken</span>
      </label>

      <div style={{display:"grid", gap:8, maxHeight:480, overflow:"auto"}}>
        {filtered.length === 0 && <div style={{color:"#6b7280"}}>Geen taken gevonden.</div>}

        {filtered.map(t => (
          <button
            key={t.id}
            onClick={()=> onAdd?.(t.id)}
            style={row}
            title="Toevoegen aan geselecteerd vak"
            draggable
            onDragStart={(e)=> handleDragStart(e, t.id)}
          >
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <img
                src={`/pictos/${t.picto || ""}`}
                alt=""
                width={36}
                height={36}
                onError={(e)=> { e.currentTarget.style.visibility="hidden"; }}
                style={{borderRadius:8, border:"1px solid #e5e7eb", background:"#fff"}}
              />
              <div>
                <div style={{fontWeight:700, textTransform:"capitalize"}}>
                  {t?.name || t.id}
                </div>
                <div style={{fontSize:12, color:"#6b7280"}}>{t.picto || "—"}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={{marginTop:10, fontSize:12, color:"#6b7280", lineHeight:1.3}}>
        Tip: klik op een taak om deze toe te voegen aan het geselecteerde vak (blauwe rand),
        of **sleep** een taak naar een vak in het weekschema.
      </div>
    </aside>
  );
}

const aside = { border:"1px solid #e5e7eb", borderRadius:16, background:"#fff", padding:12 };
const title = { fontWeight:800, fontSize:18, marginBottom:8 };
const search = { width:"100%", padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:12, marginBottom:8 };
const row = { textAlign:"left", border:"1px solid #e5e7eb", borderRadius:12, padding:"8px 10px", background:"#fff", cursor:"grab" };
