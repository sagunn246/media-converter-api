"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import DropZone from "@/components/DropZone";
import AudioPlayer from "@/components/AudioPlayer";
import YoutubeConverter from "@/components/YoutubeConverter";
import HistoryList from "@/components/HistoryList";
import { Sparkles, Shield, Zap, Music2, AlertCircle, Headphones, CheckCircle2, Upload, Video } from "lucide-react";
import clsx from "clsx";
import { ConvertedTrack, HistoryItem } from "@/types";

type Tab = "file" | "youtube";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("youtube");
  const [activeTrack, setActiveTrack] = useState<ConvertedTrack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Fetch conversion history directly from MongoDB API
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/backend/api/history");
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setHistory(result.data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch MongoDB history:", e);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const clearHistory = async () => {
    setHistory([]);
    try {
      await fetch("/api/backend/api/history", { method: "DELETE" });
    } catch (e) {
      console.error("Failed to clear MongoDB history:", e);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setErrorMessage(null);
  };

  const handleConvertStart = () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setActiveTrack(null);
  };

  const handleConvertSuccess = (data: ConvertedTrack) => {
    setIsProcessing(false);
    setActiveTrack(data);
    fetchHistory();
  };

  const handleConvertError = (msg: string) => {
    setIsProcessing(false);
    setErrorMessage(msg);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-violet-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FFmpeg Powered Ultra HD Audio Converter</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Convert & Download <br className="hidden sm:inline" />
            <span className="text-gradient">Studio-Quality MP3</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Paste a YouTube link or upload a local file to extract crisp{" "}
            <strong className="text-slate-200">320kbps MP3</strong> audio in seconds.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between text-rose-300 text-sm">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-xs text-rose-400 hover:underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* Processing Card */}
        {isProcessing && (
          <div className="glass-panel p-8 rounded-3xl text-center space-y-4 border border-violet-500/40 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl glow-gradient mx-auto flex items-center justify-center shadow-2xl shadow-violet-500/40">
              <Headphones className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                {activeTab === "youtube" ? "Streaming & Converting YouTube Audio..." : "Converting Media to MP3..."}
              </h3>
              <p className="text-sm text-slate-400">Running FFmpeg audio extraction and bitrate encoding. Please wait.</p>
            </div>
            <div className="w-full max-w-md mx-auto h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full glow-gradient w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {/* Audio Player */}
        {activeTrack && !isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Conversion Ready • Stream & Download</span>
            </div>
            <AudioPlayer
              filename={activeTrack.filename}
              downloadUrl={activeTrack.downloadUrl}
              duration={activeTrack.duration}
              durationSeconds={activeTrack.durationSeconds}
              size={activeTrack.size}
              bitrate={activeTrack.bitrate}
            />
          </div>
        )}

        {/* Converter Tabs */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          {/* Tab Header */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => handleTabChange("youtube")}
              className={clsx(
                "flex-1 flex items-center justify-center space-x-2 py-4 text-sm font-semibold transition-all",
                activeTab === "youtube"
                  ? "bg-slate-900/80 text-white border-b-2 border-violet-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              )}
            >
              <Video className={clsx("w-4 h-4", activeTab === "youtube" ? "text-red-400" : "")} />
              <span>YouTube URL</span>
            </button>
            <button
              onClick={() => handleTabChange("file")}
              className={clsx(
                "flex-1 flex items-center justify-center space-x-2 py-4 text-sm font-semibold transition-all",
                activeTab === "file"
                  ? "bg-slate-900/80 text-white border-b-2 border-violet-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              )}
            >
              <Upload className={clsx("w-4 h-4", activeTab === "file" ? "text-violet-400" : "")} />
              <span>Upload File</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "youtube" ? (
              <YoutubeConverter
                onConvertStart={handleConvertStart}
                onConvertSuccess={handleConvertSuccess}
                onConvertError={handleConvertError}
              />
            ) : (
              <DropZone
                onConvertStart={handleConvertStart}
                onConvertSuccess={handleConvertSuccess}
                onConvertError={handleConvertError}
              />
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">Lightning Fast</h4>
            <p className="text-xs text-slate-400">Powered by native FFmpeg binaries for near-instant audio encoding.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center">
              <Music2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">Up to 320kbps</h4>
            <p className="text-xs text-slate-400">Choose 128k, 192k, 256k, or 320k for audiophile-grade output.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">Automatic Cleanup</h4>
            <p className="text-xs text-slate-400">Uploads are wiped instantly and converted files purge after 24 hours.</p>
          </div>
        </div>

        {/* History */}
        <HistoryList
          items={history}
          onSelectTrack={(track) => setActiveTrack(track)}
          onClearHistory={clearHistory}
        />
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AudioPulse • Powered by Node.js, Express & FFmpeg</p>
          <div className="flex items-center space-x-4">
            <a href="/api/backend/" target="_blank" className="hover:text-slate-200 transition-colors">API Status</a>
            <a href="/api/backend/health" target="_blank" className="hover:text-slate-200 transition-colors">Health Check</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

