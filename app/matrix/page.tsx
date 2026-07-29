import type { Metadata } from "next";
import { MatrixWorkspace } from "@/components/matrix-workspace";

export const metadata: Metadata = {
  title: "Needs matrix · SCIM",
};

export default function Page() {
  return <MatrixWorkspace />;
}
