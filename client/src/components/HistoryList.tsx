"use client";

import { History, Download, Play, Music, Trash2 } from "lucide-react";

export interface HistoryItem {
  filename: string;
  downloadUrl: string;
  bitrate: string;
  size?: string;
  duration?: string;
  createdAt: string;
}

interface HistoryListProps {
  items: HistoryItem[];
  onSelectTrack: (track: HistoryItem) => void;
  onClearHistory: () => void;
}

export default function HistoryList({ items, onSelectTrack, onClearHistory }: HistoryListProps) {
  if (items.length === 0) return null;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-violet-400" />
          <h3 className="font-bold text-white text-lg">Recent Conversions</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {items.length}
          </span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center space-x-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="divide-y divide-slate-800/80">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="py-3 flex items-center justify-between hover:bg-slate-900/40 px-3 rounded-xl transition-colors group"
          >
            <div className="flex items-center space-x-3 truncate">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Music className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-200 text-sm truncate max-w-xs sm:max-w-sm">
                  {item.filename}
                </p>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <span>{item.bitrate}</span>
                  {item.size && <span>• {item.size}</span>}
                  {item.duration && <span>• {item.duration}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSelectTrack(item)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-violet-600 text-slate-300 hover:text-white transition-colors"
                title="Listen in Player"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
              <a
                href={item.downloadUrl}
                download
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Download MP3"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
