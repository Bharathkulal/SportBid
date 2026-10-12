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
  title: "SportBid — Pro Sports Registration, Poster Engine & Auction Platform",
  description:
    "Production sports player registration, automated matchday poster generation, organizer workflows, and live player auctions.",
  keywords: [
    "Sports Tournament Management",
    "Player Auction",
    "Sports Posters Generator",
    "Cricket",
    "Volleyball",
    "Football",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#090a0f] text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
