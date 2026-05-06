import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealPilot AI",
  description:
    "The AI acquisitions analyst every real estate investor wishes they had.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
