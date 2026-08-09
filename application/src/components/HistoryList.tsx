"use client";

import { History, Download, Play, Music, Trash2 } from "lucide-react";
import { HistoryItem } from "@/types";

export type { HistoryItem };

interface HistoryListProps {
  items: HistoryItem[];
  onClearHistory: () => void;
}

export default function HistoryList({ items, onClearHistory }: HistoryListProps) {
  if (items.length === 0) return null;

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
    <div className="card-panel p-5 rounded-xl border border-zinc-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-zinc-400" />
          <h3 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider">Recent Conversions</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            {items.length}
          </span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-xs text-zinc-500 hover:text-rose-400 flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {items.map((item, idx) => (
          <div
            key={`${item.filename}-${idx}`}
            className="py-2.5 flex items-center justify-between hover:bg-zinc-900/60 px-2 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-700/50">
                <Music className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-zinc-200 text-xs truncate max-w-xs sm:max-w-md">
                  {item.filename}
                </p>
                <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                  <span>{item.bitrate}</span>
                  {item.size && <span>• {item.size}</span>}
                  {item.duration && <span>• {item.duration}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <a
                href={getProxiedUrl(item.downloadUrl, true)}
                download={item.filename}
                className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Download MP3"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
