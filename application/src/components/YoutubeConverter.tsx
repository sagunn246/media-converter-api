"use client";

import { useState } from "react";
import { Link2, Search, Loader2, Play, Music, User, Clock, ExternalLink, AlertCircle } from "lucide-react";
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
    if (!text || !text.trim()) {
      return { success: false, error: `Empty response received from server (${res.status}).` };
    }
    try {
      return JSON.parse(text);
    } catch {
      if (!res.ok) {
        return { success: false, error: `Server returned error (${res.status}). Please try again.` };
      }
      return { success: false, error: "Invalid JSON response received from server." };
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
      setInfoError("Please enter a valid YouTube URL.");
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
        setInfoError(data.error || data.message || "Could not fetch YouTube details.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error: Could not reach server.";
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
        const errorMsg = result.error || result.message || "YouTube conversion failed.";
        onConvertError(errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error during conversion.";
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
    <div className="space-y-5">
      {/* Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-300">YouTube URL</label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="url"
              id="youtube-url-input"
              value={url}
              onChange={handleUrlChange}
              onKeyDown={handleKeyDown}
              disabled={isFetching || isConverting}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-zinc-100 placeholder-zinc-500 outline-none text-xs font-mono transition-colors disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={fetchVideoInfo}
            disabled={!url.trim() || isFetching || isConverting}
            className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors disabled:opacity-50 flex items-center space-x-1.5 shrink-0"
          >
            {isFetching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>{isFetching ? "Fetching" : "Fetch"}</span>
          </button>
        </div>

        {infoError && (
          <div className="flex items-center space-x-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-md">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{infoError}</span>
          </div>
        )}
      </div>

      {/* Video Preview */}
      {videoInfo && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {videoInfo.thumbnail && !thumbnailError ? (
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              loading="lazy"
              className="w-full sm:w-36 h-24 object-cover rounded-lg shrink-0 border border-zinc-800"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <div className="w-full sm:w-36 h-24 bg-zinc-950 rounded-lg shrink-0 flex items-center justify-center border border-zinc-800">
              <Music className="w-6 h-6 text-zinc-600" />
            </div>
          )}

          <div className="flex-1 space-y-1.5 min-w-0">
            <h4 className="font-semibold text-zinc-100 text-sm line-clamp-2 leading-snug">
              {videoInfo.title}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
              <span className="flex items-center space-x-1">
                <User className="w-3 h-3 text-zinc-500" />
                <span>{videoInfo.author}</span>
              </span>
              <span className="flex items-center space-x-1 font-mono">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>{videoInfo.durationFormatted}</span>
              </span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-indigo-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span>YouTube</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Quality Picker & Convert Action */}
      {videoInfo && (
        <div className="space-y-4 pt-2 border-t border-zinc-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Bitrate / Quality</span>
            <div className="flex gap-1.5">
              {["128", "192", "256", "320"].map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isConverting}
                  onClick={() => setBitrate(q)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                    bitrate === q
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  {q}k
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={isConverting}
            onClick={handleConvert}
            className="w-full py-3 rounded-lg brand-btn font-semibold text-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Converting to {bitrate}k MP3...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Convert & Download ({bitrate}kbps)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
