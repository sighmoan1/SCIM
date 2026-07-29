import type { Metadata } from "next";
import { Suspense } from "react";
import { GuidedTierBuilder } from "@/components/guided-tier-builder";

export const metadata: Metadata = {
  title: "Build wider system · SCIM",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-6">Loading builder…</div>
      }
    >
      <GuidedTierBuilder />
    </Suspense>
  );
}
