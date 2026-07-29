import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import packageJson from "../package.json";
import { AppNav } from "@/components/app-nav";
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
    "Map the infrastructure that protects you from the six ways to die, see what it depends on, and know what to do when it fails.",
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
          <AppNav />
          <main className="pb-24 md:pb-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
