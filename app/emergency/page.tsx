import type { Metadata } from "next";
import { EmergencyMode } from "@/components/emergency-mode";

export const metadata: Metadata = {
  title: "Emergency · SCIM",
};

export default function Page() {
  return <EmergencyMode />;
}
