"use client";

import dynamic from "next/dynamic";
import { LegacyMapMobileShell } from "@/components/legacy-map-mobile-shell";

const AdvancedInfrastructureMapper = dynamic(
  () => import("../advanced-infrastructure-mapper"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-gray-600">
            Loading Critical Infrastructure Mapper...
          </p>
        </div>
      </div>
    ),
  }
);

export default function Page() {
  return (
    <LegacyMapMobileShell>
      <AdvancedInfrastructureMapper />
    </LegacyMapMobileShell>
  );
}
