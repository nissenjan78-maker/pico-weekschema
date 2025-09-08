// @ts-nocheck
import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../lib/AuthProvider";
import { getDeviceId, getDeviceMode, setDeviceMode } from "../lib/deviceId";
import pico from "../assets/pico.png";

export default function DeviceModeGate({ children }) {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState(getDeviceMode()); // 'ouder' | 'kind' | null
  const deviceId = getDeviceId();

  useEffect(() => {
    if (!user || !profile || !mode) return;
    // noteer toestel voor beheer/overzicht (optioneel maar handig)
    const ref = doc(db, "families", profile.familyId, "devices", deviceId);
    setDoc(ref, {
      deviceId, mode, userId: user.uid, userRole: profile.role, lastSeenAt: Date.now()
    }, { merge: true });
  }, [user?.uid, profile?.familyId, profile?.role, mode]);

  if (!user || !profile) return null;

  // Kind-accounts mogen NIET naar oudermodus
  const canChooseParent = profile.role === "ouder";

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAF9] p-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm text-center">
          <img src={pico} alt="Pico" className="h-10 mx-auto mb-2" />
          <h2 className="text-lg font-semibold mb-2">Kies modus voor dit toestel</h2>
          <div className="grid grid-cols-1 gap-2">
            {canChooseParent && (
              <button
                onClick={() => { setDeviceMode("ouder"); setMode("ouder"); }}
                className="rounded-xl border border-emerald-200 bg-emerald-50 py-2"
              >Ouder</button>
            )}
            <button
              onClick={() => { setDeviceMode("kind"); setMode("kind"); }}
              className="rounded-xl border border-blue-200 bg-blue-50 py-2"
            >Kind</button>
          </div>
          <p className="text-xs text-slate-500 mt-3">Je kunt dit later wijzigen via instellingen.</p>
        </div>
      </div>
    );
  }

  return children;
}
