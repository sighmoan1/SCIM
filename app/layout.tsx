import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCIM",
  description: "Simple Critical Infrastructure Mapper",
  generator: "SCIM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
