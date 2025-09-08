// src/lib/useDeviceBinding.js
import { useEffect, useMemo } from "react";
import { useFamily } from "../data/familyStore";
import {
  useDevicesAll,           // << haalt ALLES op; filteren doen we met useMemo
  getOrCreateDeviceId,
  ensureCurrentDevice,
  getDeviceById,
  upsertDevice,
  bindDeviceToUser,
  setDeviceForceKidMode,
  setDeviceLabel,
  setDeviceRole,
  touchDevice,
} from "../data/devicesStore";

export function useDeviceBinding() {
  const family = useFamily();
  const famId = family.famId;
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  // Haal ALLE devices op en filter op famId met memo
  const devicesAll = useDevicesAll();
  const familyDevices = useMemo(
    () => devicesAll.filter(d => d.famId === famId),
    [devicesAll, famId]
  );

  // Zorg dat dit apparaat bestaat in de familielijst
  useEffect(() => {
    ensureCurrentDevice({ famId, deviceId });
  }, [famId, deviceId]);

  // Houd lastSeen bij
  useEffect(() => {
    touchDevice(deviceId);
    const t = setInterval(() => touchDevice(deviceId), 60_000);
    return () => clearInterval(t);
  }, [deviceId]);

  // Huidige device record
  const currentDevice = useMemo(() => {
    return getDeviceById(deviceId) || ensureCurrentDevice({ famId, deviceId });
  }, [devicesAll, famId, deviceId]);

  // Mutators voor HUIDIG device
  const setCurrentLabel = (label) => setDeviceLabel(deviceId, label);
  const setCurrentRole = (role) => setDeviceRole(deviceId, role);
  const setCurrentUser = (userId) => bindDeviceToUser(deviceId, userId);
  const setCurrentForceKidMode = (val) => setDeviceForceKidMode(deviceId, val);
  const upsertCurrentDevice = (patch) => upsertDevice({ ...currentDevice, ...patch });

  return {
    deviceId,
    currentDevice,
    familyDevices,
    setCurrentLabel,
    setCurrentRole,
    setCurrentUser,
    setCurrentForceKidMode,
    upsertCurrentDevice,
  };
}

export default useDeviceBinding;
