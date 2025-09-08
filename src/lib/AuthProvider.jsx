// src/lib/AuthProvider.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { useFamily, getFamily } from "../data/familyStore";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const family = useFamily();
  const [parentAuthed, setParentAuthed] = useState(false);

  const value = useMemo(() => ({
    family,
    parentAuthed,
    loginParent: (pin) => {
      const ok = String(pin || "") === String(getFamily().parentPin);
      setParentAuthed(ok);
      return ok;
    },
    logoutParent: () => setParentAuthed(false),
  }), [family, parentAuthed]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
