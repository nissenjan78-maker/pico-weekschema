// src/WeekschemaApp.jsx
// WeekschemaApp — 06/09/2025
// - Realtime Firestore sync (geen import/export nodig)
// - Offline cache via IndexedDB
// - Ouder/kind weergave, weekstrip, blokken, timers, sorteren, afvinken
// - Scroll-positie behouden bij acties

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useFirestoreSync } from "./useFirestoreSync.js";

/* ==========================================================
   Utils & constants
   ========================================================== */

// Mooie NL-datum: "Zaterdag 6 september"
const dfNL = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" });
function fmtDateHumanNL(d) {
  const s = dfNL.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const PARENT_PIN_DEFAULT = "1608";
const WEEKDAGEN = [
  { idx: 1, label: "Maandag",   icon: "🌙" },
  { idx: 2, label: "Dinsdag",   icon: "🦖" },
  { idx: 3, label: "Woensdag",  icon: "🐶" },
  { idx: 4, label: "Donderdag", icon: "🌩️" },
  { idx: 5, label: "Vrijdag",   icon: "👋" },
  { idx: 6, label: "Zaterdag",  icon: "🪚" },
  { idx: 7, label: "Zondag",    icon: "☀️" },
];

function uid(p="id"){return `${p}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;}
function toISODate(d){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,"0");const day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`;}
function startOfWeekMonday(date){const d=new Date(date);const day=d.getDay();const diff=day===0?-6:1-day;d.setDate(d.getDate()+diff);d.setHours(0,0,0,0);return d;}
function getISOWeek(date){const tmp=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));const day=tmp.getUTCDay()||7;tmp.setUTCDate(tmp.getUTCDate()+(4-day));const yearStart=new Date(Date.UTC(tmp.getUTCFullYear(),0,1));return Math.ceil(((tmp-yearStart)/86400000+1)/7);}
function dow1to7(d){const js=d.getDay();return js===0?7:js;}
function timeToMinutes(t){ if(!t) return null; const [hh,mm]=t.split(":").map(n=>parseInt(n,10)); if(Number.isNaN(hh)||Number.isNaN(mm)) return null; return hh*60+mm; }
function fmtSec(s){const seconds=Math.max(0, s|0); const m=Math.floor(seconds/60); const ss=seconds%60; return `${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;}
function timerKey(taskId,userId,date,block){return `${taskId}__${userId}__${date}__${block}`;}

/* ==========================================================
   Kleine UI helpers
   ========================================================== */

function Button({children,onClick,variant="primary",disabled,title,style}){
  const pal={primary:{bg:"#2563eb",hover:"#1d4ed8",fg:"#fff",border:"#1e40af"},
             ghost:{bg:"#fff",hover:"#f3f4f6",fg:"#111827",border:"#e5e7eb"},
             danger:{bg:"#dc2626",hover:"#b91c1c",fg:"#fff",border:"#991b1b"}};
  const p=pal[variant]||pal.primary;
  return (
    <button type="button" title={title}
      onClick={(e)=>{e.stopPropagation();onClick?.(e);}}
      disabled={disabled}
      style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${p.border}`,
              background:disabled?"#9ca3af":p.bg,color:p.fg,fontWeight:800,
              cursor:disabled?"not-allowed":"pointer",...style}}
      onMouseOver={(e)=>!disabled&&(e.currentTarget.style.background=p.hover)}
      onMouseOut={(e)=>!disabled&&(e.currentTarget.style.background=p.bg)}
    >{children}</button>
  );
}
function IconButton({label,onClick,disabled,title}){
  return (
    <button type="button" title={title||label}
      onClick={(e)=>{e.stopPropagation();!disabled&&onClick?.();}}
      disabled={disabled}
      style={{padding:"6px 8px",borderRadius:10,border:"1px solid #e5e7eb",
              background:disabled?"#f3f4f6":"#fff",cursor:disabled?"not-allowed":"pointer",
              fontSize:16}}
    >{label}</button>
  );
}
function Select({value,onChange,children,style}){
  return (
    <select value={value} onChange={(e)=>onChange?.(e.target.value)}
      style={{padding:"8px 10px",borderRadius:10,border:"1px solid #e5e7eb",background:"#fff",...style}}>
      {children}
    </select>
  );
}

/* ==========================================================
   Demo data
   ========================================================== */

const DEMO_USERS = [
  { id:"u_papa", name:"Papa", role:"ouder", avatar:"/avatars/Pico.png", pin:PARENT_PIN_DEFAULT },
  { id:"u_leon", name:"Leon", role:"kind", avatar:"/avatars/Leon.png" },
  { id:"u_lina", name:"Lina", role:"kind", avatar:"/avatars/Lina.png" },
];

const PICTO_READ  = "/pictos/lezen.png";
const PICTO_BATH  = "/pictos/inbad.png";
const PICTO_BRUSH = "/pictos/tandenpoetsen.png";
const PICTO_SLEEP = "/pictos/slapen.png";

const DEFAULT_LIBRARY = [
  { id:"lib_tanden",  title:"Tanden poetsen", type:"image", imageUrl:PICTO_BRUSH, defaultBlocks:["pre","post"], defaultDuration:1,  category:"Zelfzorg" },
  { id:"lib_ontbijt", title:"Ontbijt",        type:"text",  imageUrl:"",          defaultBlocks:["pre"],        defaultDuration:0,  category:"Eten" },
  { id:"lib_inbad",   title:"In bad",         type:"image", imageUrl:PICTO_BATH,  defaultBlocks:["post"],       defaultDuration:10, category:"Zelfzorg" },
  { id:"lib_lezen",   title:"Lezen",          type:"image", imageUrl:PICTO_READ,  defaultBlocks:["post"],       defaultDuration:15, category:"Rust" },
  { id:"lib_slapen",  title:"Slapen",         type:"image", imageUrl:PICTO_SLEEP, defaultBlocks:["post"],       defaultDuration:0,  category:"Rust" },
];

const DEFAULT_TASKS = [
  { id:uid("t"), assigneeId:"u_lina", title:"Tanden poetsen", displayType:"image", imageUrl:PICTO_BRUSH, days:[1,2,3,4,5], blocks:["pre","post"], durationMinutes:1,  libraryId:"lib_tanden" },
  { id:uid("t"), assigneeId:"u_lina", title:"In bad",         displayType:"image", imageUrl:PICTO_BATH,  days:[5],          blocks:["post"],     durationMinutes:10, libraryId:"lib_inbad" },
  { id:uid("t"), assigneeId:"u_lina", title:"Lezen",          displayType:"image", imageUrl:PICTO_READ,  days:[5],          blocks:["post"],     durationMinutes:15, libraryId:"lib_lezen" },
  { id:uid("t"), assigneeId:"u_lina", title:"Slapen",         displayType:"image", imageUrl:PICTO_SLEEP, days:[5],          blocks:["post"],     durationMinutes:0,  libraryId:"lib_slapen" },
];

/* ==========================================================
   Blokken & helpers
   ========================================================== */

function defaultBlocks(weekday){
  const isWeekend = weekday===6 || weekday===7;
  if(isWeekend){
    return [
      { id:"pre",    label:"Ochtend", start:"08:00", end:"12:00", allowTasks:true },
      { id:"school", label:"Middag",  start:"12:00", end:"16:00", allowTasks:true },
      { id:"post",   label:"Avond",   start:"16:00", end:"19:45", allowTasks:true },
    ];
  }
  return [
    { id:"pre",    label:"Ochtend", start:"07:00", end:"08:30", allowTasks:true },
    { id:"school", label:"School",  start:"08:30", end:"16:00", allowTasks:false },
    { id:"post",   label:"Avond",   start:"16:00", end:"19:45", allowTasks:true },
  ];
}
function blockEmoji(meta){
  if(meta.id==="pre") return "🌅";
  if(meta.id==="school"){ if(meta.label==="Middag"||meta.allowTasks) return "🌤️"; return "🏫"; }
  if(meta.id==="post") return "🌙";
  return "🧭";
}

/* ==========================================================
   Avatar (enige definitie)
   ========================================================== */

function Avatar({ value, size = 24 }) {
  const isUrl = typeof value === "string" && /^\/avatars\/.+\.(png|jpe?g|gif|svg|webp)$/i.test(value);
  return isUrl ? (
    <img src={value} alt="" style={{ width: size, height: size, objectFit: "cover", borderRadius: "50%" }} />
  ) : (
    <span style={{ fontSize: size, lineHeight: 1 }}>{value || "🙂"}</span>
  );
}

/* ==========================================================
   App
   ========================================================== */

export default function App(){

  /* ---------- state ---------- */
  const [users, setUsers] = useState(()=>JSON.parse(localStorage.getItem("ws_users")||"null")||DEMO_USERS);
  const [tasks, setTasks] = useState(()=>JSON.parse(localStorage.getItem("ws_tasks")||"null")||DEFAULT_TASKS);
  const [library, setLibrary] = useState(()=>JSON.parse(localStorage.getItem("task_library")||"null")||DEFAULT_LIBRARY);

  const [suppressions, setSuppressions] = useState(()=>{
    const raw=localStorage.getItem("ws_suppress");
    return raw? new Set(JSON.parse(raw)) : new Set();
  });
  const [completions,setCompletions]=useState([]);
  const [sortOrders,setSortOrders]=useState({});
  const [blockOverrides,setBlockOverrides]=useState({});

  // wie kijkt en welk kind tonen
  const [currentUserId,setCurrentUserId]=useState(users[0]?.id||"u_papa");
  const [visibleUserId,setVisibleUserId]=useState(users.find(u=>u.role==="kind")?.id||users[0]?.id);
  const viewer = users.find(u=>u.id===currentUserId) || users[0];
  const visible = users.find(u=>u.id===visibleUserId) || users.find(u=>u.role==="kind") || users[0];

  const [selectedDate,setSelectedDate]=useState(new Date());
  const selectedISO = toISODate(selectedDate);
  const selectedDayIdx = dow1to7(selectedDate);

  const [parentView,setParentView]=useState("showChild"); // of "dashboard" enz.

  /* ---------- Firestore realtime sync ---------- */
  const sync = useFirestoreSync({
    users, setUsers,
    tasks, setTasks,
    library, setLibrary,
    suppressions, setSuppressions,
    completions, setCompletions,
    sortOrders, setSortOrders,
    blockOverrides, setBlockOverrides,
  });

  // lok opslaan + naar Firestore pushen
  useEffect(()=>{ localStorage.setItem("ws_users", JSON.stringify(users)); sync.pushNow(); },[users]);
  useEffect(()=>{ localStorage.setItem("ws_tasks", JSON.stringify(tasks)); sync.pushNow(); },[tasks]);
  useEffect(()=>{ localStorage.setItem("task_library", JSON.stringify(library)); sync.pushNow(); },[library]);
  useEffect(()=>{ localStorage.setItem("ws_suppress", JSON.stringify(Array.from(suppressions))); sync.pushNow(); },[suppressions]);
  useEffect(()=>{ sync.pushNow(); },[completions, sortOrders, blockOverrides]);

  /* ---------- audio for timers ---------- */
  const audioCtxRef=useRef(null);
  const unlockedRef=useRef(false);
  function beep(){
    if(!unlockedRef.current) return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;
      const ctx=audioCtxRef.current||(audioCtxRef.current=new Ctx());
      ctx.resume&&ctx.resume();
      const osc=ctx.createOscillator();const g=ctx.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(880,ctx.currentTime);
      g.gain.setValueAtTime(0.001,ctx.currentTime);
      osc.connect(g).connect(ctx.destination);osc.start();
      g.gain.exponentialRampToValueAtTime(0.25,ctx.currentTime+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.25);
      osc.stop(ctx.currentTime+0.28);
    }catch{}
  }

  /* ---------- scroll preservation ---------- */
  function preserveScroll(fn) {
    const x = window.scrollX, y = window.scrollY;
    fn();
    requestAnimationFrame(() => window.scrollTo(x, y));
  }

  /* ---------- blocks & occurrences ---------- */
  const blocks = useMemo(()=>{
    const ov=blockOverrides?.[visible?.id]?.[selectedISO];
    return ov?[ov.pre,ov.school,ov.post]:defaultBlocks(selectedDayIdx);
  },[visible?.id,selectedISO,selectedDayIdx,blockOverrides]);

  const occ = useMemo(()=>{
    const out={pre:[],school:[],post:[]};
    for(const t of tasks){
      if(t.assigneeId!==visible?.id) continue;
      if(!t.days?.includes(selectedDayIdx)) continue;
      for(const b of t.blocks||[]){
        const meta=blocks.find(x=>x.id===b);
        if(!meta) continue;
        if(b==="school" && !meta.allowTasks && !t.schoolActiviteit) continue;
        if(suppressions.has(`${t.id}__${selectedISO}__${b}`)) continue;
        out[b]?.push({task:t,blockId:b});
      }
    }
    return out;
  },[tasks,visible?.id,selectedDayIdx,blocks,suppressions,selectedISO]);

  /* ---------- done set ---------- */
  const doneSet=useMemo(()=>{
    const s=new Set();
    completions.filter(c=>c.userId===visible?.id && c.date===selectedISO)
      .forEach(c=>s.add(`${c.taskId}::${c.block}`));
    return s;
  },[completions,visible?.id,selectedISO]);

  function toggleDone(taskId,blockId){
    preserveScroll(() => {
      setCompletions(prev=>{
        const idx=prev.findIndex(c=>c.taskId===taskId && c.userId===visible.id && c.date===selectedISO && c.block===blockId);
        if(idx>=0){const cp=[...prev];cp.splice(idx,1);return cp;}
        return [...prev,{id:uid("done"),taskId,userId:visible.id,date:selectedISO,block:blockId}];
      });
    });
  }

  /* ---------- ordering ---------- */
  function orderKey(userId,day,block){return `${userId}__${day}__${block}`;}
  function getSorted(list,blockId){
    const key=orderKey(visible.id,selectedDayIdx,blockId);
    const order=sortOrders[key]||[];
    const pos=(id)=>{const i=order.indexOf(id);return i===-1?Number.POSITIVE_INFINITY:i;};
    return [...list].sort((a,b)=>pos(a.task.id)-pos(b.task.id));
  }
  function ensureOrderFor(list,blockId){
    const key=orderKey(visible.id,selectedDayIdx,blockId);
    setSortOrders(s=>{
      const ids=list.map(o=>o.task.id);
      const curr=s[key]||[];
      const next=curr.filter(id=>ids.includes(id));
      ids.forEach(id=>{if(!next.includes(id)) next.push(id);});
      if(JSON.stringify(curr)===JSON.stringify(next)) return s;
      return {...s,[key]:next};
    });
  }
  function moveUp(taskId,blockId,visibleList){
    preserveScroll(() => {
      const key=orderKey(visible.id,selectedDayIdx,blockId);
      setSortOrders(s=>{
        const current=s[key]||visibleList.map(x=>x.task.id);
        const idx=current.indexOf(taskId);
        if(idx<=0) return s;
        const next=[...current]; next.splice(idx,1); next.splice(idx-1,0,taskId);
        return {...s,[key]:next};
      });
    });
  }
  function moveDown(taskId,blockId,visibleList){
    preserveScroll(() => {
      const key=orderKey(visible.id,selectedDayIdx,blockId);
      setSortOrders(s=>{
        const current=s[key]||visibleList.map(x=>x.task.id);
        const idx=current.indexOf(taskId);
        if(idx===-1 || idx>=current.length-1) return s;
        const next=[...current]; next.splice(idx,1); next.splice(idx+1,0,taskId);
        return {...s,[key]:next};
      });
    });
  }

  /* ---------- timers ---------- */
  function startTimer(task,blockId){
    if(!(task.durationMinutes>0)) return;
    preserveScroll(() => {
      if(!unlockedRef.current){
        try{
          const Ctx=window.AudioContext||window.webkitAudioContext;
          if(Ctx){audioCtxRef.current=audioCtxRef.current||new Ctx();audioCtxRef.current.resume&&audioCtxRef.current.resume();unlockedRef.current=true;}
        }catch{}
      }
      const id=timerKey(task.id,visible.id,selectedISO,blockId);
      setTimers(prev=>{
        const ex=prev.find(t=>t.id===id);
        const remaining=ex?ex.remainingSec:task.durationMinutes*60;
        const next=ex? prev.map(t=>t.id===id?{...t,status:"running"}:t)
                     : [...prev,{id,taskId:task.id,userId:visible.id,date:selectedISO,block:blockId,remainingSec:remaining,status:"running"}];
        return next;
      });
    });
  }
  function pauseTimer(taskId,blockId){
    preserveScroll(() => {
      const id=timerKey(taskId,visible.id,selectedISO,blockId);
      setTimers(prev=>prev.map(t=>t.id===id?{...t,status:"paused"}:t));
    });
  }
  function restartOccurrence(taskId,blockId,minutes){
    preserveScroll(() => {
      const id=timerKey(taskId,visible.id,selectedISO,blockId);
      setCompletions(prev=>prev.filter(c=>!(c.taskId===taskId && c.userId===visible.id && c.date===selectedISO && c.block===blockId)));
      setTimers(prev=>{
        const secs=Math.max(1,(minutes||1)*60);
        const ex=prev.find(t=>t.id===id);
        if(ex) return prev.map(t=>t.id===id?{...t,remainingSec:secs,status:"paused"}:t);
        return [...prev,{id,taskId,userId:visible.id,date:selectedISO,block:blockId,remainingSec:secs,status:"paused"}];
      });
    });
  }
  const [timers,setTimers]=useState([]);
  useEffect(()=>{
    const iv=setInterval(()=>{
      setTimers(prev=>{
        let ch=false;
        const next=prev.map(t=>{
          if(t.status!=="running") return t;
          const r=Math.max(0,(t.remainingSec||0)-1);
          if(r!==t.remainingSec) ch=true;
          return {...t,remainingSec:r};
        });
        return ch?next:prev;
      });
    },1000);
    return()=>clearInterval(iv);
  },[]);
  useEffect(()=>{
    const finished=timers.filter(t=>t.status==="running" && t.remainingSec===0);
    if(!finished.length) return;
    finished.forEach(ft=>{
      setTimers(prev=>prev.map(t=>t.id===ft.id?{...t,status:"paused"}:t));
      toggleDone(ft.taskId,ft.block); beep();
      const t=tasks.find(x=>x.id===ft.taskId);
      alert(`${t?.title||"Taak"} afgerond!`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[timers]);

  /* ==========================================================
     Header — gebruikers
     ========================================================== */

  function UsersHeader(){
    const isParent=viewer?.role==="ouder";
    return (
      <div style={{display:"flex",gap:12,alignItems:"center",justifyContent:"center",padding:12,borderBottom:"1px solid #e5e7eb",background:"#fafafa",position:"sticky",top:0,zIndex:5}}>
        {users.map(u=>{
          const active=u.id===currentUserId;
          return (
            <div key={u.id}
              onClick={()=>{
                if(u.role==="ouder" && currentUserId!==u.id){
                  const code=(window.prompt("Pincode?")||"").trim();
                  if(code!==(u.pin||PARENT_PIN_DEFAULT)) return;
                }
                setCurrentUserId(u.id);
                if(u.role==="kind"){ setVisibleUserId(u.id); setParentView("showChild"); }
                else { setParentView("dashboard"); }
              }}
              style={{cursor:"pointer",padding:"12px 16px",borderRadius:14,border:active?"2px solid #2563eb":"1px solid #e5e7eb",background:active?"#e0e7ff":"#fff",textAlign:"center",minWidth:120}}
            >
              <div style={{ marginBottom:8 }}><Avatar value={u.avatar} size={64} /></div>
              <div style={{ fontWeight:700, fontSize:14, lineHeight:1.1 }}>{u.name}</div>
            </div>
          );
        })}
        <div style={{marginLeft:12}}>
          {isParent ? (
            <span style={{fontSize:12,fontWeight:700,color:"#1e40af",background:"#e0e7ff",border:"1px solid #93c5fd",borderRadius:999,padding:"4px 10px"}}>👨‍🦱 Ouder-modus</span>
          ) : (
            <span style={{fontSize:12,color:"#6b7280",border:"1px dashed #cbd5e1",borderRadius:999,padding:"4px 10px"}}>Kind-modus</span>
          )}
        </div>
      </div>
    );
  }

  /* ==========================================================
     Tiles & blok kaarten
     ========================================================== */

  function TaskTile({task,done,onToggle,timerLeftSec,topBar}){
    const image = task.displayType==="image" && task.imageUrl;
    return (
      <div style={{display:"grid",gap:6,justifyItems:"center"}}>
        {topBar}
        <button
          type="button"
          onClick={(e)=>{e.stopPropagation();onToggle?.();}}
          onMouseDown={(e)=>e.preventDefault()}
          style={{
            border:"1px solid #e5e7eb",borderRadius:14,background:done?"#f3f4f6":"#fff",cursor:"pointer",
            width:image?"4cm":"auto",height:image?"4cm":"2cm",minWidth:image?"4cm":"3.5cm",padding:image?0:"0 14px",
            display:"inline-flex",alignItems:"center",justifyContent:"center",position:"relative"
          }}
        >
          {image?(
            <img src={task.imageUrl} alt={task.title}
                 style={{width:"100%",height:"100%",objectFit:"cover",filter:done?"grayscale(100%)":"none",borderRadius:13}}
                 draggable={false}/>
          ):(
            <span style={{fontWeight:800,fontSize:18}}>{task.title}</span>
          )}
          {typeof timerLeftSec==="number" && (
            <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",bottom:6,background:"rgba(0,0,0,0.7)",color:"#fff",
                         padding:"4px 10px",borderRadius:10,fontSize:16,fontWeight:800}}>
              {fmtSec(timerLeftSec)}
            </div>
          )}
        </button>
      </div>
    );
  }

  const [delCtx,setDelCtx]=useState(null); // {task, blockId}
  const [editCtx,setEditCtx]=useState(null); // task

  function BlockCard({meta,list}){
    useEffect(()=>{ensureOrderFor(list,meta.id);},[list,meta.id]);
    const visibleList = getSorted(list,meta.id);
    const doneCount = visibleList.filter(o=>doneSet.has(`${o.task.id}::${o.blockId}`)).length;
    const total = visibleList.length;

    const isToday = toISODate(new Date())===selectedISO;
    let isActive=false;
    if(isToday){
      const now=new Date(); const m=now.getHours()*60+now.getMinutes();
      isActive = m>=(timeToMinutes(meta.start)??-1) && m<(timeToMinutes(meta.end)??1e9);
    }
    const pct = total?(doneCount/total)*100:0;

    return (
      <div style={{border:`2px solid ${isActive?"#2563eb":"#e5e7eb"}`,borderRadius:16,background:isActive?"#eef2ff":"#fff",padding:16,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"center",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:999,background:"#f1f5f9",display:"grid",placeItems:"center"}}>{blockEmoji(meta)}</div>
            <div style={{fontWeight:800}}>{meta.label}</div>
            <div style={{color:"#6b7280"}}>{meta.start}–{meta.end}</div>
          </div>
          <div style={{textAlign:"right",color:"#6b7280",fontSize:12}}>
            {doneCount}/{total} afgevinkt
            <div style={{height:6,background:"#e5e7eb",borderRadius:999,marginTop:6,marginLeft:"auto",width:160}}>
              <div style={{height:"100%",width:`${pct}%`,background:"#2563eb",borderRadius:999}}/>
            </div>
          </div>
        </div>

        {total===0 ? (
          <div style={{border:"2px dashed #94a3b8",background:"#f8fafc",color:"#64748b",borderRadius:12,padding:"20px 12px",textAlign:"center",fontSize:13}}>
            Nog geen taken in dit blok.
          </div>
        ) : (
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
            {visibleList.map(({task,blockId}, i, arr)=>{
              const checked=doneSet.has(`${task.id}::${blockId}`);
              const tmr=timers.find(t=>t.id===timerKey(task.id,visible.id,selectedISO,blockId));
              const running=tmr?.status==="running";
              const left=tmr?.remainingSec;

              const topBar = viewer.role==="ouder" && (
                <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                  <Button variant="danger" onClick={()=>setDelCtx({task,blockId})}>🗑 Verwijderen</Button>
                  <Button variant="ghost" onClick={()=>setEditCtx(task)}>✏️ Bewerken</Button>
                </div>
              );

              return (
                <div key={`${task.id}:${blockId}`} style={{display:"grid",gap:6,justifyItems:"center"}}>
                  <TaskTile task={task} done={checked} onToggle={()=>toggleDone(task.id,blockId)} timerLeftSec={left} topBar={topBar} />
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                    <IconButton label="▲" onClick={()=>moveUp(task.id,blockId,arr)} disabled={i<=0}/>
                    <IconButton label="▼" onClick={()=>moveDown(task.id,blockId,arr)} disabled={i>=arr.length-1}/>
                    {viewer.role==="ouder" && task.durationMinutes>0 && (
                      running ? <IconButton label="⏸️" onClick={()=>pauseTimer(task.id,blockId)}/>
                              : <IconButton label="▶️" onClick={()=>startTimer(task,blockId)}/>
                    )}
                    {viewer.role==="ouder" && (checked || left===0) && (
                      <IconButton label="🔄" onClick={()=>restartOccurrence(task.id,blockId,task.durationMinutes||1)}/>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ==========================================================
     Verwijderen / Bewerken modals (compact)
     ========================================================== */

  function ModalShell({ title, onClose, children, footer, width=560 }){
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",display:"grid",placeItems:"center",zIndex:50}}>
        <div style={{width, maxWidth:"calc(100% - 32px)", background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", padding:16}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:800,fontSize:18}}>{title}</div>
            <button onClick={onClose} style={{marginLeft:"auto",border:"1px solid #e5e7eb",background:"#fff",borderRadius:10,padding:"6px 10px",cursor:"pointer"}}>✕</button>
          </div>
          <div style={{display:"grid",gap:12}}>{children}</div>
          {footer && <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>{footer}</div>}
        </div>
      </div>
    );
  }

  function DeleteTaskModal({task,blockId,onClose}){
    const [mode,setMode]=useState("block"); // block | day | all
    function perform(){
      preserveScroll(() => {
        if(mode==="block"){
          setSuppressions(prev=>new Set(prev).add(`${task.id}__${selectedISO}__${blockId}`));
        }else if(mode==="day"){
          const keys=(task.blocks||[]).map(b=>`${task.id}__${selectedISO}__${b}`);
          setSuppressions(prev=>{const s=new Set(prev); keys.forEach(k=>s.add(k)); return s;});
        }else if(mode==="all"){
          setTasks(prev=>prev.filter(t=>t.id!==task.id));
        }
      });
      onClose();
    }
    return (
      <ModalShell title={`Verwijderen — ${task.title}`} onClose={onClose}
        footer={<><Button variant="ghost" onClick={onClose}>Annuleren</Button><Button variant="danger" onClick={perform}>Verwijderen</Button></>}>
        <label><input type="radio" name="del" checked={mode==="block"} onChange={()=>setMode("block")}/> Alleen uit dit blok (vandaag)</label>
        <label><input type="radio" name="del" checked={mode==="day"} onChange={()=>setMode("day")}/> Uit deze dag (alle blokken)</label>
        <label><input type="radio" name="del" checked={mode==="all"} onChange={()=>setMode("all")}/> Volledig verwijderen</label>
      </ModalShell>
    );
  }

  function EditTaskModal({task,onClose}){
    const [title,setTitle]=useState(task.title);
    const [type,setType]=useState(task.displayType==="image"?"image":"text");
    const [imageUrl,setImageUrl]=useState(task.imageUrl||"");
    const [dur,setDur]=useState(task.durationMinutes||0);
    const [days,setDays]=useState(new Set(task.days||[]));
    const [pre,setPre]=useState(task.blocks?.includes("pre")||false);
    const [school,setSchool]=useState(task.blocks?.includes("school")||false);
    const [post,setPost]=useState(task.blocks?.includes("post")||true);

    function toggleDay(d){ const s=new Set(days); s.has(d)?s.delete(d):s.add(d); setDays(s); }
    function save(){
      preserveScroll(() => {
        const newBlocks=[pre&&"pre",school&&"school",post&&"post"].filter(Boolean);
        setTasks(prev=>prev.map(t=>t.id===task.id?{
          ...t,
          title:title.trim(),
          displayType:type==="image"?"image":"text",
          imageUrl:type==="image"?imageUrl.trim():undefined,
          durationMinutes:Math.max(0, +dur||0),
          days:Array.from(days).sort((a,b)=>a-b),
          blocks:newBlocks.length?newBlocks:["post"],
        }:t));
      });
      onClose();
    }
    const canSave = title.trim() && (type==="text" || imageUrl.trim());
    return (
      <ModalShell title={`Taak bewerken — ${task.title}`} onClose={onClose}
        footer={<><Button variant="ghost" onClick={onClose}>Annuleren</Button><Button disabled={!canSave} onClick={save}>Opslaan</Button></>}>
        <label style={{display:"grid",gap:6,fontSize:13}}>Titel
          <input value={title} onChange={e=>setTitle(e.target.value)} style={{padding:"10px 12px",borderRadius:10,border:"1px solid #e5e7eb"}}/>
        </label>
        <label style={{display:"grid",gap:6,fontSize:13}}>Type
          <Select value={type} onChange={setType}><option value="image">Afbeelding</option><option value="text">Tekst</option></Select>
        </label>
        {type==="image"&&(
          <label style={{display:"grid",gap:6,fontSize:13}}>Afbeelding
            <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="/pictos/voorbeeld.png" style={{padding:"10px 12px",borderRadius:10,border:"1px solid #e5e7eb"}}/>
          </label>
        )}
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <fieldset style={{border:"1px solid #e5e7eb",borderRadius:12,padding:8}}>
            <legend style={{fontSize:12}}>Blokken</legend>
            <label><input type="checkbox" checked={pre} onChange={()=>setPre(!pre)}/> Ochtend</label>{" "}
            <label><input type="checkbox" checked={school} onChange={()=>setSchool(!school)}/> School/Middag</label>{" "}
            <label><input type="checkbox" checked={post} onChange={()=>setPost(!post)}/> Avond</label>
          </fieldset>
          <fieldset style={{border:"1px solid #e5e7eb",borderRadius:12,padding:8}}>
            <legend style={{fontSize:12}}>Dagen</legend>
            {WEEKDAGEN.map(d=>(
              <label key={d.idx} style={{marginRight:8}}><input type="checkbox" checked={days.has(d.idx)} onChange={()=>toggleDay(d.idx)}/> {d.label.slice(0,2)}</label>
            ))}
          </fieldset>
          <label style={{display:"grid",gap:6,fontSize:13}}>Duur (min)
            <input type="number" min={0} value={dur} onChange={e=>setDur(parseInt(e.target.value||"0",10))}
              style={{width:120,padding:"10px 12px",borderRadius:10,border:"1px solid #e5e7eb"}}/>
          </label>
        </div>
      </ModalShell>
    );
  }

  /* ==========================================================
     Weekstrip helpers
     ========================================================== */

  function countsForDate(date){
    if(!visible) return {done:0,total:0};
    const iso=toISODate(date); const weekday=dow1to7(date);
    const ov=blockOverrides?.[visible.id]?.[iso];
    const useBlocks=ov?[ov.pre,ov.school,ov.post]:defaultBlocks(weekday);
    let total=0, done=0;

    for(const t of tasks){
      if(t.assigneeId!==visible.id) continue;
      if(!t.days?.includes(weekday)) continue;
      for(const b of t.blocks||[]){
        const meta=useBlocks.find(x=>x.id===b); if(!meta) continue;
        if(b==="school" && !meta.allowTasks && !t.schoolActiviteit) continue;
        if(suppressions.has(`${t.id}__${iso}__${b}`)) continue;
        total++;
        const isDone=completions.some(c=>c.userId===visible.id && c.date===iso && c.taskId===t.id && c.block===b);
        if(isDone) done++;
      }
    }
    return {done,total};
  }

  function getWeekDates(selDate){
    const start=startOfWeekMonday(selDate);
    return Array.from({length:7}).map((_,i)=>{const d=new Date(start); d.setDate(start.getDate()+i); return d;});
  }
  const weekDates = getWeekDates(selectedDate);
  const weekTitle = `${startOfWeekMonday(selectedDate).toLocaleString("nl-BE",{month:"long"})} – Week ${getISOWeek(selectedDate)}`;

  /* ==========================================================
     Render
     ========================================================== */

  return (
    <div style={{minHeight:"100dvh",background:"#f8fafc"}}>
      <UsersHeader/>

      <div style={{maxWidth:1200,margin:"16px auto",padding:"0 16px"}}>
        <div style={{border:"1px solid #e5e7eb",borderRadius:16,background:"#fff",padding:16}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:12,gap:8,flexWrap:"wrap"}}>
            <div style={{fontWeight:800}}>{weekTitle}</div>
            {viewer.role==="ouder" && (
              <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#6b7280"}}>Schema van:</span>
                <Select value={visible.id} onChange={(v)=>setVisibleUserId(v)} style={{width:220}}>
                  {users.filter(u=>u.role==="kind").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
              </div>
            )}
          </div>

          {/* WEEKSTRIP */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
            {weekDates.map(d=>{
              const iso=toISODate(d); const isSelected=iso===selectedISO;
              const meta=WEEKDAGEN[dow1to7(d)-1];
              const {done,total}=countsForDate(d);
              const pct=total?(done/total)*100:0;
              return (
                <button key={iso} type="button" onClick={()=>setSelectedDate(d)}
                  style={{textAlign:"left",padding:12,borderRadius:12,border:`2px solid ${isSelected?"#1e40af":"#e5e7eb"}`,background:isSelected?"#eef2ff":"#fff",cursor:"pointer"}}
                >
                  <div style={{fontSize:16,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
                    <span>{meta.icon}</span><span>{meta.label}</span>
                  </div>
                  <div style={{fontSize:20,fontWeight:800,marginTop:4}}>{d.getDate()}</div>
                  <div style={{marginTop:6,color:"#6b7280",fontSize:12}}>{done}/{total} afgevinkt</div>
                  <div style={{height:6,background:"#e5e7eb",borderRadius:999,marginTop:4}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"#2563eb",borderRadius:999}}/>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto 32px",padding:"0 16px"}}>
        <div style={{border:"1px solid #e5e7eb",borderRadius:16,background:"#fff",padding:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontWeight:800}}><Avatar value={visible?.avatar} size={24}/> {visible?.name}</span>
            <span style={{color:"#6b7280"}}>— {fmtDateHumanNL(selectedDate)}</span>
          </div>

          <BlockCard meta={blocks[0]} list={occ.pre}/>
          <BlockCard meta={blocks[1]} list={occ.school}/>
          <BlockCard meta={blocks[2]} list={occ.post}/>
        </div>
      </div>

      {/* Modals */}
      {delCtx && <DeleteTaskModal task={delCtx.task} blockId={delCtx.blockId} onClose={()=>setDelCtx(null)}/>}
      {editCtx && <EditTaskModal task={editCtx} onClose={()=>setEditCtx(null)}/>}
    </div>
  );
}
