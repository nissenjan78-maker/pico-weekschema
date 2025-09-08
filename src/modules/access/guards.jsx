// src/modules/access/guards.jsx
import React from "react";
import { useAccess } from "./AccessProvider";

/** Rendert alleen als role === ouder */
export function VisibleIfParent({ children }) {
  const { isParent } = useAccess();
  return isParent ? children : null;
}

/** Rendert niets als role === kind */
export function HiddenOnChild({ children }) {
  const { isParent } = useAccess();
  return isParent ? children : null;
}

/** Blokkeert kinderen expliciet (kan een fallback tonen) */
export function RequireParent({ children, fallback = null }) {
  const { isParent } = useAccess();
  return isParent ? children : fallback;
}
