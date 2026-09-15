import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Face Mask Detection",
  description: "Student computer vision project for face-mask status detection.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

