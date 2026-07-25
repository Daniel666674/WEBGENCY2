"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let reloaded = false;
    // When a new service worker takes control (i.e. a new deploy activated),
    // reload once so the page runs against the fresh assets instead of whatever
    // the previous worker had in memory. Guarded so it can only fire a single
    // reload per page load.
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for an updated worker immediately, and again whenever the tab
        // regains focus, so a deploy is picked up without a manual cache clear.
        registration.update().catch(() => {});
        const onFocus = () => registration.update().catch(() => {});
        window.addEventListener("focus", onFocus);
      })
      .catch(() => {
        // Installability is a progressive enhancement — safe to ignore failures.
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
