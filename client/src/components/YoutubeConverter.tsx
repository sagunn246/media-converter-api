"use client";

import { useState } from "react";
import { Video, Search, Loader2, Sparkles, SlidersHorizontal, Music, User, Clock, ExternalLink, AlertCircle } from "lucide-react";

interface VideoInfo {
  title: string;
  author: string;
  durationFormatted: string;
  thumbnail: string;
}

interface YoutubeConverterProps {
  onConvertStart: () => void;
  onConvertSuccess: (data: any) => void;
  onConvertError: (message: string) => void;
}

export default function YoutubeConverter({
  onConvertStart,
  onConvertSuccess,
  onConvertError,
}: YoutubeConverterProps) {
  const [url, setUrl] = useState("");
  const [bitrate, setBitrate] = useState("320");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const isYoutubeUrl = (value: string) => {
    return (
      value.includes("youtube.com/watch") ||
      value.includes("youtu.be/") ||
      value.includes("youtube.com/shorts/")
    );
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setVideoInfo(null);
    setInfoError(null);
  };

  const fetchVideoInfo = async () => {
    if (!url.trim()) return;
    if (!isYoutubeUrl(url)) {
      setInfoError("Please enter a valid YouTube URL (youtube.com or youtu.be).");
      return;
    }

    setIsFetching(true);
    setInfoError(null);
    setVideoInfo(null);

    try {
      const res = await fetch(`/api/backend/api/youtube/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setVideoInfo(data.data);
      } else {
        setInfoError(data.message || "Could not fetch YouTube video details.");
      }
    } catch (err: any) {
      setInfoError("Network error: Could not reach API server.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleConvert = async () => {
    if (!url || !videoInfo) return;

    setIsConverting(true);
    onConvertStart();

    try {
      const res = await fetch("/api/backend/api/youtube/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, bitrate }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        onConvertSuccess({
          ...result.data,
          filename: result.videoTitle || result.data?.filename,
        });
      } else {
        onConvertError(result.message || "YouTube conversion failed. Please try again.");
      }
    } catch (err: any) {
      onConvertError(err.message || "Network error during YouTube conversion.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") fetchVideoInfo();
  };

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
          <Video className="w-4 h-4 text-red-400" />
          <span>Paste YouTube Video URL</span>
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
            <input
              type="url"
              id="youtube-url-input"
              value={url}
              onChange={handleUrlChange}
              onKeyDown={handleKeyDown}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm font-mono"
            />
          </div>
          <button
            onClick={fetchVideoInfo}
            disabled={!url.trim() || isFetching}
            className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{isFetching ? "Fetching..." : "Fetch"}</span>
          </button>
        </div>

        {infoError && (
          <div className="flex items-center space-x-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{infoError}</span>
          </div>
        )}
      </div>

      {/* Video Info Preview Card */}
      {videoInfo && (
        <div className="bg-slate-900/80 border border-violet-500/30 rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-0">
            {/* Thumbnail */}
            {videoInfo.thumbnail && (
              <div className="sm:w-48 shrink-0 relative">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-full h-full object-cover sm:h-36"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/60 hidden sm:block" />
              </div>
            )}

            {/* Details */}
            <div className="p-5 flex-1 space-y-3">
              <h4 className="font-bold text-white text-base line-clamp-2 leading-snug">
                {videoInfo.title}
              </h4>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-violet-400" />
                  <span>{videoInfo.author}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-fuchsia-400" />
                  <span>{videoInfo.durationFormatted}</span>
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-red-400 hover:text-red-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View on YouTube</span>
                </a>
              </div>

              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Ready to convert</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bitrate Selector + Convert Button */}
      {videoInfo && (
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <SlidersHorizontal className="w-5 h-5 text-violet-400" />
              <div>
                <label className="text-sm font-semibold text-white block">Audio Quality</label>
                <span className="text-xs text-slate-400">Higher = better sound, larger file</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "128k", value: "128", tag: "Standard" },
                { label: "192k", value: "192", tag: "Medium" },
                { label: "256k", value: "256", tag: "High" },
                { label: "320k", value: "320", tag: "Ultra HD" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBitrate(opt.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex flex-col items-center transition-all ${
                    bitrate === opt.value
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-2 ring-violet-400"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <span className="font-mono text-sm">{opt.label}</span>
                  <span className="text-[10px] opacity-75 font-normal">{opt.tag}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={isConverting}
            onClick={handleConvert}
            className="w-full py-4 rounded-xl glow-gradient font-bold text-white shadow-xl shadow-violet-600/25 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Downloading & Converting to MP3...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Convert to {bitrate}k MP3</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty State Hint */}
      {!videoInfo && !isFetching && !url && (
        <div className="text-center py-8 text-slate-500 text-sm space-y-2">
          <Music className="w-10 h-10 mx-auto text-slate-700" />
          <p>Paste a YouTube URL above and click <span className="text-slate-300 font-semibold">Fetch</span> to preview the video before converting.</p>
        </div>
      )}
    </div>
  );
}
