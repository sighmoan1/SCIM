"use client";

import dynamic from "next/dynamic";

const AdvancedInfrastructureMapper = dynamic(
  () => import("../advanced-infrastructure-mapper"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading Critical Infrastructure Mapper...
          </p>
        </div>
      </div>
    ),
  }
);

export default function Page() {
  return <AdvancedInfrastructureMapper />;
}
