import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Flash from "@/components/Flash";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blood Finder",
  description: "Find blood donors near you",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <Navbar />
        <Flash />
        <main>{children}</main>
      </body>
    </html>
  );
}
