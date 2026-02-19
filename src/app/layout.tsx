import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vibe-board-andy.vercel.app"),
  title: "Bad Day — 나쁜 하루도 괜찮아",
  description:
    "일기를 쓰면 AI가 감정을 분석하고, 당신에게 어울리는 음악과 따뜻한 메시지를 전해드려요.",
  openGraph: {
    title: "Bad Day — 나쁜 하루도 괜찮아",
    description:
      "일기를 쓰면 AI가 감정을 분석하고, 당신에게 어울리는 음악과 따뜻한 메시지를 전해드려요.",
    url: "https://vibe-board-andy.vercel.app",
    siteName: "Bad Day",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Bad Day — AI 감정 일기",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bad Day — 나쁜 하루도 괜찮아",
    description:
      "일기를 쓰면 AI가 감정을 분석하고, 당신에게 어울리는 음악과 따뜻한 메시지를 전해드려요.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="ko"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <body className="antialiased font-sans bg-zinc-950 text-white">
          <Providers>{children}</Providers>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
