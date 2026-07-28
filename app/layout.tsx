import type { Metadata } from "next";
import Link from "next/link";
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
        <header className="sticky top-0 z-[90] border-b bg-background/95 px-3 py-2 backdrop-blur">
          <nav aria-label="SCIM workspace" className="mx-auto flex max-w-7xl items-center gap-1">
            <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/">
              Map
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/editor">
              Model
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/review">
              Review proposals
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer
          aria-label="Version information"
          className="m-3 rounded-md border bg-background/90 px-2 py-1 text-center font-mono text-[11px] text-muted-foreground shadow-sm backdrop-blur sm:pointer-events-none sm:fixed sm:bottom-2 sm:right-2 sm:z-[100] sm:m-0"
        >
          SCIM Mapper v{appVersion} · Schema v{SCIM_SCHEMA_VERSION} · Build {buildVersion}
        </footer>
      </body>
    </html>
  );
}
