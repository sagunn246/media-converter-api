"use client";

import { useState } from "react";
import { Video, Search, Loader2, Sparkles, SlidersHorizontal, Music, User, Clock, ExternalLink, AlertCircle } from "lucide-react";
import { ConvertedTrack, VideoInfo, ApiResponse } from "@/types";

interface YoutubeConverterProps {
  onConvertStart: () => void;
  onConvertSuccess: (data: ConvertedTrack) => void;
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
  const [thumbnailError, setThumbnailError] = useState(false);

  const isYoutubeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const youtubeRegex = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+$/i;
    return youtubeRegex.test(trimmed);
  };

  const safeParseResponse = async <T = unknown,>(res: Response): Promise<ApiResponse<T>> => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      if (!res.ok) {
        return { success: false, error: `Server returned error (${res.status}: ${res.statusText || 'Error'}). Please try again.` };
      }
      return { success: false, error: "Invalid response received from server." };
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setVideoInfo(null);
    setInfoError(null);
    setThumbnailError(false);
  };

  const fetchVideoInfo = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    if (!isYoutubeUrl(cleanUrl)) {
      setInfoError("Please enter a valid YouTube URL (e.g. youtube.com or youtu.be).");
      return;
    }

    setIsFetching(true);
    setInfoError(null);
    setVideoInfo(null);
    setThumbnailError(false);

    try {
      const res = await fetch(`/api/backend/api/youtube/info?url=${encodeURIComponent(cleanUrl)}`);
      const data = await safeParseResponse<VideoInfo>(res);

      if (res.ok && data.success && data.data) {
        setVideoInfo(data.data);
      } else {
        setInfoError(data.error || data.message || "Could not fetch YouTube video details.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error: Could not reach API server.";
      setInfoError(errorMsg);
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
        body: JSON.stringify({ url: url.trim(), bitrate }),
      });

      const result = await safeParseResponse<ConvertedTrack>(res);

      if (res.ok && result.success) {
        const payload = result.data || (result as unknown as ConvertedTrack);
        const rawTitle = result.videoTitle || payload.videoTitle || videoInfo.title || "YouTube Audio";
        const cleanTitle = rawTitle.replace(/\.mp3$/i, "") + ".mp3";

        onConvertSuccess({
          ...payload,
          filename: cleanTitle,
          bitrate: `${bitrate}k`,
        });
      } else {
        const errorMsg = result.error || result.message || "YouTube conversion failed. Please try again.";
        onConvertError(errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error during YouTube conversion.";
      onConvertError(errorMsg);
    } finally {
      setIsConverting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isFetching && !isConverting) {
      fetchVideoInfo();
    }
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
              disabled={isFetching || isConverting}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-sm font-mono disabled:opacity-50"
            />
          </div>
          <button
            onClick={fetchVideoInfo}
            disabled={!url.trim() || isFetching || isConverting}
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
            {videoInfo.thumbnail && !thumbnailError ? (
              <div className="sm:w-48 shrink-0 relative bg-slate-950">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  loading="lazy"
                  className="w-full h-full object-cover sm:h-36"
                  onError={() => setThumbnailError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/60 hidden sm:block" />
              </div>
            ) : (
              <div className="sm:w-48 shrink-0 relative bg-slate-950/80 flex items-center justify-center p-6 sm:h-36 border-r border-slate-800/50">
                <Music className="w-10 h-10 text-violet-400/60" />
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
                  disabled={isConverting}
                  onClick={() => setBitrate(opt.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex flex-col items-center transition-all disabled:opacity-50 ${
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

