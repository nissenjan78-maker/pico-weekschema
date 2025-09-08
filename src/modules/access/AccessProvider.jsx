// src/modules/access/AccessProvider.jsx
import React, { createContext, useContext, useMemo } from "react";
import { useDeviceBinding } from "../../lib/useDeviceBinding";

/**
 * AccessContext centraliseert:
 *  - role: "ouder" | "kind"
 *  - boundUserId: het kind-id op een kind-toestel (anders null)
 *  - isParent: snel vlaggetje
 *  - ready: binding klaar?
 *
 * Provider verwacht "users" (lijst uit je Firestore sync) als prop,
 * zodat de module zelf ook kan valideren of het gebonden kind bestaat.
 */
const AccessContext = createContext(null);

export function AccessProvider({ users = [], children }) {
  const { binding, ready } = useDeviceBinding();

  const value = useMemo(() => {
    const role = binding?.role || "ouder";
    const isParent = role === "ouder";
    const boundUserId = isParent ? null : binding?.userId || null;

    // (optioneel) valideren dat het gebonden id echt een kind is
    const kidExists =
      !isParent &&
      boundUserId &&
      users.some((u) => u.id === boundUserId && u.role === "kind");

    return {
      ready,
      role,
      isParent,
      boundUserId: kidExists ? boundUserId : null,
    };
  }, [binding, users]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess() must be used inside <AccessProvider>");
  return ctx;
}
