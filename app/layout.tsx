import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import packageJson from "../package.json";
import { AppNav } from "@/components/app-nav";
import { OfflineStatus } from "@/components/offline-status";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const appVersion = packageJson.version;

export const metadata: Metadata = {
  title: "SCIM — What is keeping you alive?",
  description:
    "Map the infrastructure and social systems that meet vital needs, see what they depend on, and know what to do when they fail.",
  generator: `SCIM Mapper v${appVersion}`,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SCIM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1514" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ServiceWorkerRegistration />
          <OfflineStatus />
          <AppNav />
          <main className="app-main">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
