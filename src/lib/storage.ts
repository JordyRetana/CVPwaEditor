"use client";

import { AppState, initialState, normalizeResume } from "./resume";

const STORAGE_KEY = "cv-pwa-editor-state-v1";
const DEVICE_KEY = "cv-pwa-editor-device-v1";

export function loadState(): AppState {
  if (typeof window === "undefined") return initialState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...initialState,
      ...parsed,
      resume: normalizeResume(parsed.resume),
      license: { ...initialState.license, ...parsed.license },
      theme: parsed.theme === "light" ? "light" : "dark"
    };
  } catch {
    return initialState;
  }
}

export function saveState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDeviceId() {
  let deviceId = window.localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, deviceId);
  }

  return deviceId;
}

export async function getDeviceHash() {
  const deviceId = getDeviceId();
  const data = new TextEncoder().encode(`cv-pwa:${deviceId}:${navigator.userAgent}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
