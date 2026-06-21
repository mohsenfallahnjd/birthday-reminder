import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { AppProgressProvider } from "@/components/progress-provider";
import { PwaInstallHint } from "@/components/pwa-install";
import { DateSystemProvider } from "@/lib/date-system-context";
import { getDateSystem } from "@/lib/date-system";
import { CurrencyProvider } from "@/lib/currency-context";
import { getCurrency } from "@/lib/currency";
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
  title: "Birthday",
  description: "Jalali birthday reminders, wishlists, and group gifts.",
  applicationName: "Birthday",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Birthday",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  maximumScale: 1,
  minimumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dateSystem = await getDateSystem();
  const currency = await getCurrency();

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <AppProgressProvider>
          <CurrencyProvider value={currency}>
          <DateSystemProvider value={dateSystem}>
            <Nav />
            <main className="flex-1 min-w-0">{children}</main>
            <PwaInstallHint />
            <footer className="pb-20 pt-4 text-center md:pb-6">
              <p className="text-[11px] text-muted/50">
                <span className="inline-block animate-bounce">🧑‍💻</span>{" "}
                Built with{" "}
                <span className="inline-block hover:animate-spin cursor-default">☕</span>{" "}
                by{" "}
                <a href="https://themohsen.me" target="_blank" rel="noreferrer" className="font-medium text-muted/70 hover:text-foreground transition-colors">
                  Mohsen
                </a>
                {" "}
                <span className="inline-block hover:scale-150 transition-transform cursor-default">✨</span>
              </p>
            </footer>
          </DateSystemProvider>
          </CurrencyProvider>
        </AppProgressProvider>
      </body>
    </html>
  );
}
