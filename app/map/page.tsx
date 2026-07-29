import type { Metadata } from "next";
import { ScimCanonicalMapWorkspace } from "@/components/scim-canonical-map-workspace";

export const metadata: Metadata = {
  title: "Map · SCIM",
};

export default function Page() {
  return <ScimCanonicalMapWorkspace />;
}
