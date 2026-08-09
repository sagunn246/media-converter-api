/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import DropZone from "@/components/DropZone";
import AudioPlayer from "@/components/AudioPlayer";
import YoutubeConverter from "@/components/YoutubeConverter";
import HistoryList from "@/components/HistoryList";
import { AlertCircle, Headphones, Check, Upload, Link2 } from "lucide-react";
import clsx from "clsx";
import { ConvertedTrack, HistoryItem } from "@/types";

type Tab = "youtube" | "file";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("youtube");
  const [activeTrack, setActiveTrack] = useState<ConvertedTrack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Fetch conversion history directly from MongoDB API
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/backend/api/history?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        try {
          const result = JSON.parse(text);
          if (result.success && Array.isArray(result.data)) {
            setHistory(result.data);
          }
        } catch (jsonErr) {
          console.warn("Invalid JSON response from history API:", jsonErr);
        }
      } else {
        console.warn("History API returned status:", res.status);
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
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

        {/* Header Title */}
        <div className="text-center space-y-1.5 max-w-xl mx-auto py-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Audio & Video MP3 Converter
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Convert YouTube videos or local media files to 320kbps MP3 audio directly.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-xs text-rose-400 hover:underline font-medium cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Processing Card */}
        {isProcessing && (
          <div className="card-panel p-6 rounded-xl text-center space-y-3 border border-zinc-800">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/20">
              <Headphones className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-200">
                {activeTab === "youtube" ? "Streaming & Converting YouTube Audio..." : "Converting Media to MP3..."}
              </h3>
              <p className="text-xs text-zinc-400">Processing audio extraction with FFmpeg. Please wait.</p>
            </div>
            <div className="w-full max-w-xs mx-auto h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {/* Audio Player Result */}
        {activeTrack && !isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
              <Check className="w-3.5 h-3.5" />
              <span>Conversion Ready</span>
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

        {/* Main Card Container */}
        <div className="card-panel rounded-xl border border-zinc-800 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800/80 bg-zinc-950/40">
            <button
              onClick={() => handleTabChange("youtube")}
              className={clsx(
                "flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "youtube"
                  ? "bg-zinc-900 text-zinc-100 border-b-2 border-indigo-500"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              )}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>YouTube Link</span>
            </button>
            <button
              onClick={() => handleTabChange("file")}
              className={clsx(
                "flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "file"
                  ? "bg-zinc-900 text-zinc-100 border-b-2 border-indigo-500"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Local File</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5">
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

        {/* History */}
        <HistoryList
          items={history}
          onSelectTrack={(track) => setActiveTrack(track)}
          onClearHistory={clearHistory}
        />
      </main>

      <footer className="border-t border-zinc-900 py-6 text-center text-[11px] text-zinc-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Media Converter</p>
          <div className="flex items-center space-x-3 text-zinc-500">
            <a href="/api/backend/" target="_blank" className="hover:text-zinc-300 transition-colors">API Status</a>
            <span>•</span>
            <a href="/api/backend/health" target="_blank" className="hover:text-zinc-300 transition-colors">Health Check</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
