"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Transient confirmation toast pinned above the tab bar. */
export function useSnackbar(): {
  snackbar: string;
  visible: boolean;
  show: (message: string) => void;
} {
  const [snackbar, setSnackbar] = useState("");
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string) => {
    setSnackbar(message);
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 3200);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return { snackbar, visible, show };
}

export function Snackbar({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-50 flex justify-center px-4 transition-all duration-300 ease-out md:bottom-6",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      )}
    >
      {message && (
        <div className="max-w-md rounded-full bg-foreground px-4 py-2.5 text-center text-sm font-medium text-background shadow-soft">
          {message}
        </div>
      )}
    </div>
  );
}
