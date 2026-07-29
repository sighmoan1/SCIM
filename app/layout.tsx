import type { Metadata } from "next";
import packageJson from "../package.json";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

const appVersion = packageJson.version;

export const metadata: Metadata = {
  title: "SCIM — What is keeping you alive?",
  description:
    "Map the infrastructure that protects you from the six ways to die, see what it depends on, and know what to do when it fails.",
  generator: `SCIM Mapper v${appVersion}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppNav />
        <main className="pb-20 md:pb-4">{children}</main>
      </body>
    </html>
  );
}
