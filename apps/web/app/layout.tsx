import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./styles.css";

const plexSans = IBM_Plex_Sans({ weight: ["400", "500", "600"], subsets: ["latin", "vietnamese"], variable: "--font-plex-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["400", "600"], subsets: ["latin", "vietnamese"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Face Mask Detection",
  description: "Student computer vision project for face-mask status detection.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${plexSans.variable} ${plexMono.variable}`}>{children}</body>
    </html>
  );
}

