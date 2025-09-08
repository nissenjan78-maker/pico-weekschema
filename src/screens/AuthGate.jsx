// src/screens/AuthGate.jsx
// Simpel login/registratie scherm voor Firebase Auth + Firestore bootstrap

// @ts-nocheck
import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";

export default function AuthGate() {
  // 👇 Geen TypeScript generics in .jsx
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // string | null

  const onLogin = async (e) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      // AuthProvider vangt de state change op
    } catch (err) {
      setMsg(humanAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      // 1) account
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        pass
      );
      const uid = cred.user.uid;

      // 2) familie-doc
      const familyRef = await addDoc(collection(db, "families"), {
        name: familyName.trim() || "Onze familie",
        ownerUid: uid,
        createdAt: serverTimestamp(),
        plan: "1o-1k", // default licentie; later aanpasbaar
      });

      // 3) users/{uid}
      await setDoc(doc(db, "users", uid), {
        uid,
        email: cred.user.email,
        displayName: displayName.trim() || "Ouder",
        role: "ouder",
        familyId: familyRef.id,
        createdAt: serverTimestamp(),
      });

      setMsg("Account aangemaakt! Je wordt zo ingelogd.");
      // user is al ingelogd; AuthProvider toont de app
    } catch (err) {
      setMsg(humanAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    setMsg(null);
    if (!email.trim()) {
      setMsg("Vul eerst je e-mail in voor een resetlink.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Resetlink verzonden. Check je mailbox.");
    } catch (err) {
      setMsg(humanAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "radial-gradient(20px 20px at 20px 20px, rgba(255,255,255,.6) 20%, rgba(255,255,255,0) 21%), #F4F9F6",
        backgroundSize: "24px 24px, 100% 100%",
      }}
    >
      <div className="w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4 shadow">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
              mode === "login"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-slate-200"
            }`}
            disabled={busy}
          >
            Inloggen
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
              mode === "register"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-slate-200"
            }`}
            disabled={busy}
          >
            Nieuwe familie
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={onLogin} className="space-y-2">
            <div>
              <label className="text-xs text-slate-600">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Wachtwoord</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                required
              />
            </div>

            {msg && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl border px-3 py-2 text-sm bg-emerald-50 border-emerald-200 text-emerald-700"
            >
              {busy ? "Bezig…" : "Inloggen"}
            </button>

            <button
              type="button"
              onClick={onReset}
              disabled={busy}
              className="w-full rounded-xl border px-3 py-2 text-xs bg-white border-slate-200 text-slate-600"
            >
              Wachtwoord vergeten
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister} className="space-y-2">
            <div>
              <label className="text-xs text-slate-600">Familienaam</label>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                placeholder="bv. Familie Janssens"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Jouw naam</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                placeholder="bv. Mama An"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Wachtwoord</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                required
                minLength={6}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Minimaal 6 tekens.
              </p>
            </div>

            {msg && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl border px-3 py-2 text-sm bg-emerald-50 border-emerald-200 text-emerald-700"
            >
              {busy ? "Bezig…" : "Familie aanmaken"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function humanAuthError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "E-mail is al in gebruik.";
  if (code.includes("invalid-email")) return "Ongeldig e-mailadres.";
  if (code.includes("wrong-password")) return "Onjuist wachtwoord.";
  if (code.includes("user-not-found")) return "Geen account met dit adres.";
  if (code.includes("weak-password")) return "Wachtwoord is te zwak.";
  if (code.includes("too-many-requests"))
    return "Even te veel pogingen — probeer later opnieuw.";
  return err?.message || "Er ging iets mis.";
}
