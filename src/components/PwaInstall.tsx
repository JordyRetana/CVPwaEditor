"use client";

import { useEffect, useState } from "react";

export function PwaInstall() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    setReady(!standalone);
  }, []);

  if (!ready) return null;

  return (
    <div className="install-note">
      <strong>iPhone:</strong> abre en Safari, toca compartir y elige <span>Agregar a pantalla de inicio</span>.
    </div>
  );
}
