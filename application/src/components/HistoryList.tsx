"use client";

import { History, Download, Music, Trash2 } from "lucide-react";
import { HistoryItem } from "@/types";

export type { HistoryItem };

interface HistoryListProps {
  items: HistoryItem[];
  onClearHistory: () => void;
}

export default function HistoryList({ items, onClearHistory }: HistoryListProps) {
  const getProxiedUrl = (url: string, forceDownload = false) => {
    if (!url) return "";
    let finalUrl = url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const parsed = new URL(url);
        finalUrl = `/api/backend${parsed.pathname}`;
      } catch {
        finalUrl = url;
      }
    }
    return forceDownload ? `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}download=1` : finalUrl;
  };

  return (
    <div className="card-panel p-6 rounded-2xl border border-zinc-800/80 shadow-lg space-y-4 animate-enter">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
        <div className="flex items-center space-x-2.5">
          <History className="w-4.5 h-4.5 text-indigo-400" />
          <h3 className="font-semibold text-zinc-100 text-sm tracking-wide">Recent Conversions</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono font-medium">
            {items.length}
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-zinc-500 hover:text-rose-400 flex items-center space-x-1.5 transition-colors cursor-pointer group"
          >
            <Trash2 className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800/80 mb-2">
            <Music className="w-5 h-5 text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-300">No conversions yet</p>
          <p className="text-xs text-zinc-500">Your converted files will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/40">
          {items.map((item, idx) => (
            <div
              key={`${item.filename}-${idx}`}
              className="py-3 flex items-center justify-between hover:bg-zinc-900/40 px-3 -mx-3 rounded-xl transition-all duration-300 group animate-enter"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-indigo-400 shrink-0 border border-zinc-800/60 shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Music className="w-4 h-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium text-zinc-200 text-[13px] truncate max-w-[200px] sm:max-w-md group-hover:text-indigo-300 transition-colors">
                    {item.filename}
                  </p>
                  <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                    <span>{item.bitrate}</span>
                    {item.size && <span>• {item.size}</span>}
                    {item.duration && <span>• {item.duration}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0 pl-4">
                <a
                  href={getProxiedUrl(item.downloadUrl, true)}
                  download={item.filename}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-indigo-600 text-zinc-300 hover:text-white transition-all duration-300 cursor-pointer text-xs font-medium flex items-center space-x-1.5 group/btn border border-zinc-700/50 hover:border-indigo-500/50"
                  title="Download MP3"
                >
                  <Download className="w-3.5 h-3.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
