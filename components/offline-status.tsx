"use client";

import { useEffect, useState } from "react";

export function OfflineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-50 bg-warn px-3 py-2 text-center text-sm font-semibold text-black"
    >
      Offline — using the copy stored on this device. Changes remain local.
    </div>
  );
}
