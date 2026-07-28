import type { Metadata } from "next";
import packageJson from "../package.json";
import { SCIM_SCHEMA_VERSION, shortCommitSha } from "@/lib/scim/version";
import "./globals.css";

const appVersion = packageJson.version;
const buildVersion = shortCommitSha(process.env.VERCEL_GIT_COMMIT_SHA);

export const metadata: Metadata = {
  title: `SCIM Mapper v${appVersion}`,
  description: "Simple Critical Infrastructure Mapper",
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
        {children}
        <footer
          aria-label="Version information"
          className="pointer-events-none fixed bottom-2 right-2 z-[100] rounded-md border bg-background/90 px-2 py-1 font-mono text-[11px] text-muted-foreground shadow-sm backdrop-blur"
        >
          SCIM Mapper v{appVersion} · Schema v{SCIM_SCHEMA_VERSION} · Build {buildVersion}
        </footer>
      </body>
    </html>
  );
}
