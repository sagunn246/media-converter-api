"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import DropZone from "@/components/DropZone";
import YoutubeConverter from "@/components/YoutubeConverter";
import HistoryList from "@/components/HistoryList";
import { AlertCircle, Upload, Link2 } from "lucide-react";
import clsx from "clsx";
import { HistoryItem } from "@/types";

type Tab = "youtube" | "file";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("youtube");
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

  // Poll history every 5 seconds automatically
  useEffect(() => {
    fetchHistory();
    const interval = setInterval(() => {
      fetchHistory();
    }, 5000);
    return () => clearInterval(interval);
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
    setErrorMessage(null);
  };

  const handleConvertSuccess = () => {
    fetchHistory();
  };

  const handleConvertError = (msg: string) => {
    setErrorMessage(msg);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated Background Glow */}
      <div className="bg-glow-container">
        <div className="bg-glow"></div>
        <div className="bg-glow-2"></div>
      </div>

      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8 relative z-10 animate-enter">

        {/* Header Title */}
        <div className="text-center space-y-2 max-w-xl mx-auto py-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
            Audio & Video MP3 Converter
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-medium">
            Convert videos and local media into high-quality MP3 audio.
          </p>
        </div>

        {/* Error Alert / Info Alert */}
        {errorMessage && (
          <div className={clsx("border p-3.5 rounded-xl flex items-center justify-between text-sm shadow-sm animate-enter", 
            errorMessage.includes("background") || errorMessage.includes("longer than expected") 
              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-200" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-200"
          )}>
            <div className="flex items-center space-x-2.5">
              <AlertCircle className={clsx("w-4.5 h-4.5 shrink-0", 
                errorMessage.includes("background") || errorMessage.includes("longer than expected") 
                  ? "text-indigo-400" 
                  : "text-rose-400"
              )} />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-xs hover:underline font-medium cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Card Container */}
        <div className="card-panel rounded-2xl overflow-hidden relative">
          {/* Tabs */}
          <div className="flex relative bg-zinc-950/50 p-1.5 m-2.5 rounded-xl border border-zinc-800/60 shadow-inner">
            <button
              onClick={() => handleTabChange("youtube")}
              className={clsx(
                "flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer",
                activeTab === "youtube"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              )}
            >
              <Link2 className="w-4 h-4" />
              <span>YouTube Link</span>
            </button>
            <button
              onClick={() => handleTabChange("file")}
              className={clsx(
                "flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer",
                activeTab === "file"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              )}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Local File</span>
            </button>
          </div>

          {/* Form Content */}
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

        {/* History */}
        <HistoryList
          items={history}
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
