"use client";

import { Disc } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full border-b border-zinc-800/40 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600/20 group-hover:border-indigo-500/30 transition-all duration-300">
            <Disc className="w-4.5 h-4.5" />
          </div>
          <span className="font-semibold text-[15px] text-zinc-100 tracking-tight group-hover:text-white transition-colors duration-300">
            Media Converter
          </span>
        </div>
      </div>
    </header>
  );
}
