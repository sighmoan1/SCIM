"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";

type InteractionMode = "navigate" | "edit";

interface ActiveTouch {
  pointerId: number;
  target: Element;
  startX: number;
  startY: number;
  startedAt: number;
  dragged: boolean;
}

interface TapRecord {
  target: Element;
  x: number;
  y: number;
  at: number;
}

function isInteractiveControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "button, a, input, textarea, select, option, [role='dialog'], [data-no-touch-bridge]"
      )
    )
  );
}

function dispatchMouse(
  type: "mousedown" | "mousemove" | "mouseup" | "click" | "dblclick",
  pointer: ReactPointerEvent<HTMLElement>,
  target: Element,
  buttons: number
): void {
  target.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: pointer.clientX,
      clientY: pointer.clientY,
      screenX: pointer.screenX,
      screenY: pointer.screenY,
      button: 0,
      buttons,
      detail: type === "dblclick" ? 2 : 1,
      ctrlKey: pointer.ctrlKey,
      shiftKey: pointer.shiftKey,
      altKey: pointer.altKey,
      metaKey: pointer.metaKey,
    })
  );
}

export function LegacyMapMobileShell({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<InteractionMode>("navigate");
  const [announcement, setAnnouncement] = useState(
    "Navigate mode. Drag the page to move around the map."
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeTouchRef = useRef<ActiveTouch | null>(null);
  const previousTapRef = useRef<TapRecord | null>(null);

  const changeMode = (nextMode: InteractionMode) => {
    activeTouchRef.current = null;
    setMode(nextMode);
    setAnnouncement(
      nextMode === "edit"
        ? "Edit mode. Drag map objects with one finger. Tap an object twice to open its existing editor."
        : "Navigate mode. Drag the page to move around the map."
    );
  };

  const centreMap = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({
      left: Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2),
      top: Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2),
      behavior: "smooth",
    });
    setAnnouncement("Map centred in the mobile viewport.");
  };

  const pointerTarget = (event: ReactPointerEvent<HTMLElement>): Element | null => {
    return document.elementFromPoint(event.clientX, event.clientY) ??
      (event.target instanceof Element ? event.target : null);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== "edit" || event.pointerType === "mouse") return;
    if (isInteractiveControl(event.target)) return;
    const target = pointerTarget(event);
    if (!target) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeTouchRef.current = {
      pointerId: event.pointerId,
      target,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: Date.now(),
      dragged: false,
    };
    dispatchMouse("mousedown", event, target, 1);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = activeTouchRef.current;
    if (
      mode !== "edit" ||
      event.pointerType === "mouse" ||
      !active ||
      active.pointerId !== event.pointerId
    ) {
      return;
    }

    event.preventDefault();
    const distance = Math.hypot(
      event.clientX - active.startX,
      event.clientY - active.startY
    );
    if (distance > 7) active.dragged = true;
    dispatchMouse("mousemove", event, pointerTarget(event) ?? active.target, 1);
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = activeTouchRef.current;
    if (
      mode !== "edit" ||
      event.pointerType === "mouse" ||
      !active ||
      active.pointerId !== event.pointerId
    ) {
      return;
    }

    event.preventDefault();
    const target = pointerTarget(event) ?? active.target;
    dispatchMouse("mouseup", event, target, 0);

    if (!active.dragged && Date.now() - active.startedAt < 700) {
      dispatchMouse("click", event, target, 0);
      const previous = previousTapRef.current;
      const isDoubleTap = Boolean(
        previous &&
          Date.now() - previous.at < 420 &&
          previous.target === active.target &&
          Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 24
      );
      if (isDoubleTap) {
        dispatchMouse("dblclick", event, target, 0);
        previousTapRef.current = null;
      } else {
        previousTapRef.current = {
          target: active.target,
          x: event.clientX,
          y: event.clientY,
          at: Date.now(),
        };
      }
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activeTouchRef.current = null;
  };

  return (
    <section className="legacy-map-shell">
      <div
        className="legacy-map-mobile-toolbar md:hidden"
        data-no-touch-bridge
        aria-label="Mobile map interaction controls"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Button
            size="sm"
            variant={mode === "navigate" ? "default" : "outline"}
            aria-pressed={mode === "navigate"}
            onClick={() => changeMode("navigate")}
          >
            Navigate
          </Button>
          <Button
            size="sm"
            variant={mode === "edit" ? "default" : "outline"}
            aria-pressed={mode === "edit"}
            onClick={() => changeMode("edit")}
          >
            Edit map
          </Button>
          <Button size="sm" variant="outline" onClick={centreMap}>
            Centre
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "navigate"
            ? "Pan around the full desktop-sized map."
            : "Drag objects; double-tap to use existing edit actions."}
        </p>
      </div>

      <div
        ref={viewportRef}
        className="legacy-map-viewport"
        data-interaction-mode={mode}
        onPointerDownCapture={handlePointerDown}
        onPointerMoveCapture={handlePointerMove}
        onPointerUpCapture={finishPointer}
        onPointerCancelCapture={finishPointer}
      >
        <div className="legacy-map-stage">{children}</div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
