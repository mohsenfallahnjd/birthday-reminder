import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "جشن تولد | یادآور تولد و هدیه گروهی",
  description:
    "یادآوری تولد شمسی، گروه دوستان، لیست آرزو و جمع‌آوری هدیه با تأیید ادمین مالی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} h-full`}>
      <body className="party-bg min-h-full flex flex-col antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
