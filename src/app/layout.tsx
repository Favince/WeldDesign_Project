import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://krisavaaerovin.my.id"),
  title: "WeldDesign Production | Aerovin",
  description:
    "Web app terpadu untuk estimasi biaya las, inventaris, monitoring proyek, AI inspection, DKV generator, portofolio siswa, dan client portal.",
  applicationName: "WeldDesign Production",
  openGraph: {
    title: "WeldDesign Production",
    description:
      "Console produksi las dan desain DKV untuk guru, siswa, admin, dan client.",
    url: "https://krisavaaerovin.my.id",
    siteName: "WeldDesign Production",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
