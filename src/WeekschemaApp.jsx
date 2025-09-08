// src/WeekschemaApp.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import CompactParentHeader from "./modules/parent/CompactParentHeader.jsx";
import ParentHome from "./modules/parent/ParentHome.jsx";
import WeekSchedulePanel from "./modules/parent/panels/WeekSchedulePanel.jsx";
import { useHousehold } from "./hooks/useHousehold.js";

/* ===================== Helpers / constants ===================== */
const DAY_IDS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const BLOCKS = [
  { id: "morning", label: "Ochtend" },
  { id: "noon",    label: "Middag" }, // wordt "School" als blockOverrides[userId][ISO].schoolDay === true
  { id: "evening", label: "Avond" },
];
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const computeMonday = (d) => {
  const copy = new Date(d);
  const weekday = (copy.getDay() + 6) % 7; // ma=0
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - weekday);
  return copy;
};

/* Kleine helper om een picto-<img> node te maken (werkt in LIB_BY_ID) */
const P = (filename, alt = "") => (
  <img
    src={`/pictos/${filename}`}
    alt={alt}
    style={{ width: 20, height: 20, objectFit: "contain", display: "block" }}
    draggable={false}
  />
);

export default function WeekschemaApp() {
  /* ===================== View routing ===================== */
  const [activeView, setActiveView] = useState("home"); // 'home'|'weekschedule'|'blocks'|'users'|'devices'|'library'

  /* ===================== Firestore household ===================== */
  const famId = import.meta.env.VITE_FAM_ID || "default";
  const {
    ready: isFirestoreReady,
    data: hh,
    libraryById: HH_LIB_BY_ID,
    planned: HH_PLANNED,
    blockOverrides: HH_BLOCKS,
  } = useHousehold(famId);

  /* ===================== Users (avatars in /public/avatars) ===================== */
  const [users, setUsers] = useState([
    { id: "papa", name: "Papa", role: "Ouder", avatar: "/avatars/Papa.png" },
    { id: "leon", name: "Leon", role: "Kind",  avatar: "/avatars/Leon.png" },
    { id: "lina", name: "Lina", role: "Kind",  avatar: "/avatars/Lina.png" },
  ]);
  // Tip: als je members in Firestore bewaart: setUsers(hh.members)

  // Actief kind (voor weekschema/blokken)
  const [currentUserId, setCurrentUserId] = useState(() => {
    const firstKid = users.find(u => (u.role || "").toLowerCase() === "kind");
    return firstKid?.id;
  });
  useEffect(() => {
    if (!users.some(u => u.id === currentUserId)) {
      const firstKid = users.find(u => (u.role || "").toLowerCase() === "kind");
      setCurrentUserId(firstKid?.id);
    }
  }, [users, currentUserId]);

  /* ===================== Library (pictos uit /public/pictos) ===================== */
  // Gebruik Firestore data als die er is (verwacht structuur { byId: {taskId:{id,title,icon?...}}, ... } in hook),
  // anders een nette fallback met echte picto-afbeeldingen:
  const LIB_BY_ID = useMemo(() => {
    const fromFs =
      HH_LIB_BY_ID && Object.keys(HH_LIB_BY_ID).length > 0 ? HH_LIB_BY_ID : null;
    if (fromFs) return fromFs;

    return {
      t_opstaan:      { id: "t_opstaan",      title: "Opstaan",           icon: P("Opstaan.png", "Opstaan") },
      t_ontbijt:      { id: "t_ontbijt",      title: "Ontbijt",           icon: P("Ontbijt.png", "Ontbijt") },
      t_aankleden:    { id: "t_aankleden",    title: "Aankleden",         icon: P("Aankleden.png", "Aankleden") },
      t_tanden:       { id: "t_tanden",       title: "Tanden poetsen",    icon: P("Tandenpoetsen.png", "Tanden poetsen") },
      t_school:       { id: "t_school",       title: "School",            icon: P("Pico_School.png", "School") },
      t_inbad:        { id: "t_inbad",        title: "In bad",            icon: P("Pico_InBad.png", "In bad") },
      t_pyjama:       { id: "t_pyjama",       title: "Pyjama aandoen",    icon: P("Pyjama aandoen.png", "Pyjama") },
      t_slapen:       { id: "t_slapen",       title: "Slapen",            icon: P("Pico_slapen.png", "Slapen") },
      t_buiten:       { id: "t_buiten",       title: "Buiten spelen",     icon: P("Buiten spelen.png", "Buiten spelen") },
      t_spelen:       { id: "t_spelen",       title: "Spelen",            icon: P("Spelen.png", "Spelen") },
      t_lezen:        { id: "t_lezen",        title: "Lezen",             icon: P("Lezen.png", "Lezen") },
      t_tablet:       { id: "t_tablet",       title: "Tablet",            icon: P("Tablet.png", "Tablet") },
      t_tv:           { id: "t_tv",           title: "TV kijken",         icon: P("Tv kijken.png", "TV kijken") },
      t_toilet:       { id: "t_toilet",       title: "Naar het toilet",   icon: P("Naar het toilet.png", "Naar het toilet") },
      t_naarschool:   { id: "t_naarschool",   title: "Naar school gaan",  icon: P("Naar school gaan.png", "Naar school gaan") },
      t_naarschool2:  { id: "t_naarschool2",  title: "Naar school (2)",   icon: P("Naar school gaan 2.png", "Naar school gaan") },
      t_avondAVG:     { id: "t_avondAVG",     title: "Avond eten (AVG)",  icon: P("Avond eten AVG.png", "Avond eten") },
      t_avondSPAG:    { id: "t_avondSPAG",    title: "Avond eten (Spag.)",icon: P("Avond eten SPAGHETTI.png", "Avond eten") },
      t_douchen:      { id: "t_douchen",      title: "Douchen",           icon: P("Douchen.png", "Douchen") },
      t_inbad_plain:  { id: "t_inbad_plain",  title: "In bad (plain)",    icon: P("in bad.png", "In bad") },
    };
  }, [HH_LIB_BY_ID]);

  const buildFilteredLibrary = useCallback(
    (userId /*, weekStart */) => {
      const u = users.find(x => x.id === userId);
      if (!u) return Object.values(LIB_BY_ID);
      const isKid = (u.role || "").toLowerCase() === "kind";
      return isKid ? Object.values(LIB_BY_ID) : [];
    },
    [users, LIB_BY_ID]
  );

  /* ===================== Assignments (schema) ===================== */
  const emptyAssignments = useMemo(() => {
    const base = {};
    for (const d of DAY_IDS) base[d] = { morning: [], noon: [], evening: [] };
    return base;
  }, []);

  // per kind
  const [assignmentsPerUser, setAssignmentsPerUser] = useState({});
  // sync vanuit Firestore "planned" (verwacht vorm: planned[userId][dayId][blockId] = [taskId,...])
  useEffect(() => {
    if (HH_PLANNED && typeof HH_PLANNED === "object") {
      setAssignmentsPerUser(HH_PLANNED);
    }
  }, [HH_PLANNED]);

  // actuele assignments voor het actieve kind
  const assignments = useMemo(() => {
    if (!currentUserId) return emptyAssignments;
    return assignmentsPerUser[currentUserId] || emptyAssignments;
  }, [assignmentsPerUser, currentUserId, emptyAssignments]);

  // DnD handlers
  const onDropTask = useCallback(
    (dayId, blockId, taskId, from) => {
      if (!currentUserId) return;
      setAssignmentsPerUser(prev => {
        const forUser = { ...(prev[currentUserId] || emptyAssignments) };
        // verplaats: verwijder uit bron
        if (from?.dayId && from?.blockId) {
          forUser[from.dayId] = { ...forUser[from.dayId] };
          forUser[from.dayId][from.blockId] = forUser[from.dayId][from.blockId].filter(
            id => id !== taskId
          );
        }
        // voeg toe aan doel
        forUser[dayId] = { ...forUser[dayId] };
        if (!forUser[dayId][blockId].includes(taskId)) {
          forUser[dayId][blockId] = [...forUser[dayId][blockId], taskId];
        }
        return { ...prev, [currentUserId]: forUser };
      });
    },
    [currentUserId, emptyAssignments]
  );

  const removeTask = useCallback(
    (dayId, blockId, taskId) => {
      if (!currentUserId) return;
      setAssignmentsPerUser(prev => {
        const forUser = { ...(prev[currentUserId] || emptyAssignments) };
        forUser[dayId] = { ...forUser[dayId] };
        forUser[dayId][blockId] = forUser[dayId][blockId].filter(id => id !== taskId);
        return { ...prev, [currentUserId]: forUser };
      });
    },
    [currentUserId, emptyAssignments]
  );

  /* ===================== Block-overrides (schooldag) ===================== */
  // Komt uit Firestore document (mag leeg zijn)
  const blockOverrides = HH_BLOCKS || {};

  /* ===================== Week navigatie ===================== */
  const [monday, setMonday] = useState(() => computeMonday(new Date()));
  const gotoPrevWeek = () => setMonday(m => addDays(m, -7));
  const gotoNextWeek = () => setMonday(m => addDays(m, +7));
  const gotoThisWeek = () => setMonday(computeMonday(new Date()));

  /* ===================== Trace (dev) ===================== */
  useEffect(() => {
    console.log("[WeekschemaApp] view:", activeView, "household:", famId, "FS ready:", isFirestoreReady);
  }, [activeView, famId, isFirestoreReady]);

  /* ===================== Views ===================== */
  const renderView = () => {
    switch (activeView) {
      case "weekschedule":
        return (
          <>
            <CompactParentHeader
              users={users}
              currentUserId={currentUserId}
              onFocusUser={setCurrentUserId}
              famId={famId}
              isFirestoreReady={isFirestoreReady}
              forceAdminActive={false} // in inhoud-views tonen we het kind als actief
            />
            <WeekSchedulePanel
              // library
              LIB_BY_ID={LIB_BY_ID}
              filteredLibrary={buildFilteredLibrary(currentUserId, monday)}
              buildFilteredLibrary={buildFilteredLibrary}
              // schema
              assignments={assignments}
              DAY_IDS={DAY_IDS}
              BLOCKS={BLOCKS}
              // week
              monday={monday}
              addDays={addDays}
              gotoPrevWeek={gotoPrevWeek}
              gotoThisWeek={gotoThisWeek}
              gotoNextWeek={gotoNextWeek}
              // DnD
              onDropTask={onDropTask}
              removeTask={removeTask}
              // “Middag” → “School”
              blockOverrides={blockOverrides}
              toISO={toISO}
            />
          </>
        );

      case "blocks":
        return (
          <>
            <CompactParentHeader
              users={users}
              currentUserId={currentUserId}
              onFocusUser={setCurrentUserId}
              famId={famId}
              isFirestoreReady={isFirestoreReady}
              forceAdminActive={false}
            />
            <div className="ph-card">
              <div className="ph-headbar"><span className="ph-chip">Blokken beheren</span></div>
              <div className="ph-card-body ph-card-body--tight">
                <p className="text-sm" style={{ color: "rgba(0,0,0,.66)" }}>
                  Hier komt je Blokken-beheer. Koppel <code>blockOverrides[userId][ISO].schoolDay</code> voor weekschema-labels.
                </p>
              </div>
            </div>
          </>
        );

      case "users":
        return (
          <>
            <CompactParentHeader
              users={users}
              currentUserId={currentUserId}
              onFocusUser={setCurrentUserId}
              famId={famId}
              isFirestoreReady={isFirestoreReady}
            />
            <div className="ph-card">
              <div className="ph-headbar"><span className="ph-chip">Gebruikers</span></div>
              <div className="ph-card-body ph-card-body--tight">
                <p className="text-sm" style={{ color: "rgba(0,0,0,.66)" }}>
                  Beheer gebruikers (rollen, avatars, device-binding, …).
                </p>
              </div>
            </div>
          </>
        );

      case "devices":
        return (
          <>
            <CompactParentHeader
              users={users}
              currentUserId={currentUserId}
              onFocusUser={setCurrentUserId}
              famId={famId}
              isFirestoreReady={isFirestoreReady}
            />
            <div className="ph-card">
              <div className="ph-headbar"><span className="ph-chip">Devices</span></div>
              <div className="ph-card-body ph-card-body--tight">
                <p className="text-sm" style={{ color: "rgba(0,0,0,.66)" }}>
                  Devices-overzicht en koppelingen komen hier.
                </p>
              </div>
            </div>
          </>
        );

      case "library":
        return (
          <>
            <CompactParentHeader
              users={users}
              currentUserId={currentUserId}
              onFocusUser={setCurrentUserId}
              famId={famId}
              isFirestoreReady={isFirestoreReady}
            />
            <div className="ph-card">
              <div className="ph-headbar"><span className="ph-chip">Bibliotheek</span></div>
              <div className="ph-card-body ph-card-body--tight">
                <p className="text-sm" style={{ color: "rgba(0,0,0,.66)" }}>
                  Bibliotheekbeheer (pictogrammen/taken) komt hier.
                </p>
              </div>
            </div>
          </>
        );

      case "home":
      default:
        return (
          <>
            {/* Op Home willen we Papa (ouder) als actief kader */}
            <CompactParentHeader
              users={users}
              currentUserId={currentUserId}
              onFocusUser={setCurrentUserId}
              famId={famId}
              isFirestoreReady={isFirestoreReady}
              forceAdminActive
            />
            <ParentHome
              activeView={activeView}
              onOpen={setActiveView}
              title="Menu"
            />
          </>
        );
    }
  };

  return <div className="ws-app">{renderView()}</div>;
}
