import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartShift — ตารางเวรนอกเวลาราชการ",
  description:
    "ตารางปฏิบัติงานนอกเวลาราชการและวันหยุดราชการ กลุ่มงานเทคนิคการแพทย์ โรงพยาบาลสมเด็จพระยุพราชกระนวน",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${notoThai.className} min-h-dvh`}>{children}</body>
    </html>
  );
}
