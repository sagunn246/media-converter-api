"use me";
"use client";

import { useEffect, useState } from "react";
import { Music, Activity, ShieldCheck, Sparkles } from "lucide-react";

export default function Header() {
  const [apiStatus, setApiStatus] = useState<"loading" | "online" | "offline">("loading");
  const [uptime, setUptime] = useState<number | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/backend/health");
        if (res.ok) {
          const data = await res.json();
          setApiStatus("online");
          setUptime(data.uptime);
        } else {
          setApiStatus("offline");
        }
      } catch (err) {
        setApiStatus("offline");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl glow-gradient flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">AudioPulse</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                PRO MP3
              </span>
            </div>
            <p className="text-xs text-slate-400">High Quality Media Converter</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-medium">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">API Status:</span>
            {apiStatus === "loading" ? (
              <span className="text-amber-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Connecting...</span>
              </span>
            ) : apiStatus === "online" ? (
              <span className="text-emerald-400 flex items-center space-x-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Connected</span>
              </span>
            ) : (
              <span className="text-rose-400 flex items-center space-x-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Offline</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
