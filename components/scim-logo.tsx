import { cn } from "@/lib/utils";

/**
 * SCIM brand mark: the radial map motif — a person at the centre, rings of
 * infrastructure, six sector spokes for the six ways to die.
 */
export function ScimLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
    >
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.6" opacity="0.9" />
      <circle cx="24" cy="24" r="12.5" stroke="currentColor" strokeWidth="2.6" opacity="0.55" />
      {[30, 90, 150, 210, 270, 330].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 24 + Math.cos(rad) * 15.5;
        const y1 = 24 + Math.sin(rad) * 15.5;
        const x2 = 24 + Math.cos(rad) * 20;
        const y2 = 24 + Math.sin(rad) * 20;
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.55"
          />
        );
      })}
      <circle cx="24" cy="24" r="5.5" fill="currentColor" />
    </svg>
  );
}
