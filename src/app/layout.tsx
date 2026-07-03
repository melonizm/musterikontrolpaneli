import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Not Alma - Müşteri Yönetim Paneli",
  description: "İşletmeniz için müşteri kaydı, arama takibi ve müşteri bilgilerini yönetme paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <Sidebar />
        <div className="app-layout">
          <div className="sidebar-spacer" />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
