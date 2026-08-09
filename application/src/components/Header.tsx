"use client";

import { useEffect, useState } from "react";
import { Disc, Activity } from "lucide-react";

export default function Header() {
  const [apiStatus, setApiStatus] = useState<"loading" | "online" | "offline">("loading");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/backend/health");
        if (res.ok) {
          setApiStatus("online");
        } else {
          setApiStatus("offline");
        }
      } catch {
        setApiStatus("offline");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Disc className="w-4 h-4" />
          </div>
          <span className="font-semibold text-base text-zinc-100 tracking-tight">
            Media Converter
          </span>
        </div>

        {/* API Status Dot */}
        <div className="flex items-center space-x-2 bg-zinc-900/80 border border-zinc-800/80 px-3 py-1 rounded-full text-xs text-zinc-400 font-medium">
          <Activity className="w-3.5 h-3.5 text-zinc-500" />
          <span>API:</span>
          {apiStatus === "loading" ? (
            <span className="text-amber-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Connecting</span>
            </span>
          ) : apiStatus === "online" ? (
            <span className="text-emerald-400 flex items-center space-x-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Operational</span>
            </span>
          ) : (
            <span className="text-rose-400 flex items-center space-x-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>Offline</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
