// src/modules/access/hooks.js
import { useEffect, useMemo } from "react";
import { useAccess } from "./AccessProvider";

/**
 * Hook om je gebruikerslijst voor de avatar-header te filteren.
 * Kind-toestel ziet alleen zichzelf, ouder ziet iedereen.
 */
export function useHeaderUsers(users) {
  const { isParent, boundUserId } = useAccess();
  return useMemo(() => {
    if (isParent) return users;
    return users.filter((u) => u.id === boundUserId);
  }, [isParent, boundUserId, users]);
}

/**
 * Lock de zichtbare gebruiker als het device aan een kind gekoppeld is.
 * Je geeft setCurrentUserId, setVisibleUserId, setParentView mee.
 */
export function useLockVisibleUser({
  users,
  setCurrentUserId,
  setVisibleUserId,
  setParentView,
}) {
  const { ready, isParent, boundUserId } = useAccess();

  useEffect(() => {
    if (!ready) return;
    if (!isParent && boundUserId) {
      const kidExists = users.some((u) => u.id === boundUserId && u.role === "kind");
      if (kidExists) {
        setCurrentUserId(boundUserId);
        setVisibleUserId(boundUserId);
        setParentView?.("showChild"); // geen ouderpanelen voor kind
      }
    }
  }, [ready, isParent, boundUserId, users, setCurrentUserId, setVisibleUserId, setParentView]);
}

/**
 * Handig vlaggetje als je ergens snel wilt weten of schrijven mag.
 * (Vandaag: alleen ouders mogen schrijven.)
 */
export function useCanEdit() {
  const { isParent } = useAccess();
  return isParent;
}
