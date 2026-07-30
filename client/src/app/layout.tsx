import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "AudioPulse | Music & Video to MP3 Converter & Downloader",
  description: "Convert video and audio files (MP4, MOV, WEBM, WAV) into studio-quality 320kbps MP3 music files instantly with built-in live streaming player.",
  keywords: ["music downloader", "mp3 converter", "video to mp3", "audio converter", "320kbps mp3", "media converter"],
  authors: [{ name: "AudioPulse" }],
  openGraph: {
    title: "AudioPulse - High Quality Music & Video Downloader",
    description: "Extract high quality 320kbps MP3 audio from any media file instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="bg-[#090d16] text-slate-100 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
