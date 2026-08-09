/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, Play, Music, User, Clock, ExternalLink, AlertCircle, RefreshCw, Download } from "lucide-react";
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
  const [successData, setSuccessData] = useState<ConvertedTrack | null>(null);
  const [conversionPhase, setConversionPhase] = useState("");

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

  const fetchVideoInfo = useCallback(async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    if (!isYoutubeUrl(cleanUrl)) {
      setInfoError("That doesn't look like a valid YouTube URL.");
      return;
    }

    setIsFetching(true);
    setInfoError(null);
    setVideoInfo(null);
    setThumbnailError(false);
    setSuccessData(null);

    try {
      const res = await fetch(`/api/backend/api/youtube/info?url=${encodeURIComponent(cleanUrl)}`);
      const data = await safeParseResponse<VideoInfo>(res);

      if (res.ok && data.success && data.data) {
        setVideoInfo(data.data);
      } else {
        setInfoError(data.error || data.message || "Couldn't fetch this video. Please check the URL and try again.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error: Could not reach server.";
      setInfoError(errorMsg);
    } finally {
      setIsFetching(false);
    }
  }, [url]);

  // Auto-fetch if URL is pasted
  useEffect(() => {
    if (url && isYoutubeUrl(url) && !isFetching && !isConverting && !successData && !videoInfo) {
      const timeout = setTimeout(() => {
        fetchVideoInfo();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [url, fetchVideoInfo, isFetching, isConverting, successData, videoInfo]);


  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setInfoError(null);
    setThumbnailError(false);
    if (successData) setSuccessData(null);
  };



  const handleConvert = async () => {
    if (!url || !videoInfo) return;

    setIsConverting(true);
    setConversionPhase("Preparing extraction...");
    onConvertStart();

    // Simulate phases for UI feedback
    const phases = ["Fetching audio stream...", "Converting to MP3...", "Finalizing metadata..."];
    let phaseIndex = 0;
    const phaseInterval = setInterval(() => {
      if (phaseIndex < phases.length) {
        setConversionPhase(phases[phaseIndex]);
        phaseIndex++;
      }
    }, 4000);

    try {
      const res = await fetch("/api/backend/api/youtube/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), bitrate }),
      });

      clearInterval(phaseInterval);
      const result = await safeParseResponse<ConvertedTrack>(res);

      if (res.ok && result.success) {
        const payload = result.data || (result as unknown as ConvertedTrack);
        const rawTitle = result.videoTitle || payload.videoTitle || videoInfo.title || "YouTube Audio";
        const cleanTitle = rawTitle.replace(/\.mp3$/i, "") + ".mp3";

        const finalData = {
          ...payload,
          filename: cleanTitle,
          bitrate: `${bitrate}k`,
        };
        
        setSuccessData(finalData);
        onConvertSuccess(finalData);
      } else if (
        res.status === 504 || 
        res.status === 502 || 
        (res.status === 500 && result.error?.includes("Server returned error (500)"))
      ) {
        onConvertError("Conversion is taking longer than expected. It is processing in the background and will appear in history shortly.");
        // We reset the UI because it's backgrounding
        setUrl("");
        setVideoInfo(null);
      } else {
        const errorMsg = result.error || result.message || "Something went wrong while converting your file.";
        onConvertError(errorMsg);
      }
    } catch (err: unknown) {
      clearInterval(phaseInterval);
      const errorMsg = err instanceof Error ? err.message : "Network error during conversion.";
      onConvertError(errorMsg);
    } finally {
      clearInterval(phaseInterval);
      setIsConverting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isFetching && !isConverting) {
      fetchVideoInfo();
    }
  };

  const getProxiedUrl = (absoluteUrl: string) => {
    if (!absoluteUrl) return "";
    try {
      const urlObj = new URL(absoluteUrl);
      return `/api/backend${urlObj.pathname}${urlObj.search}`;
    } catch {
      return absoluteUrl;
    }
  };

  if (successData) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-5 animate-enter">
        <div className="success-checkmark">
          <div className="success-checkmark__circle"></div>
          <div className="success-checkmark__check"></div>
        </div>
        
        <div className="text-center space-y-1.5">
          <h3 className="text-xl font-bold text-emerald-400">Conversion Complete</h3>
          <p className="text-sm text-zinc-300 font-medium truncate max-w-sm px-4">{successData.filename}</p>
          <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500 font-mono">
            <span>{successData.bitrate}</span>
            <span>•</span>
            <span>{successData.size || "Unknown size"}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-4">
          <a
            href={getProxiedUrl(successData.downloadUrl)}
            download={successData.filename}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Download MP3</span>
          </a>
          <button
            onClick={() => {
              setSuccessData(null);
              setUrl("");
              setVideoInfo(null);
            }}
            className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors"
          >
            Convert Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-2 relative">
        <div className="relative group">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            disabled={isFetching || isConverting}
            placeholder="Paste YouTube link here..."
            className="w-full pl-11 pr-24 py-3.5 bg-zinc-900/50 border border-zinc-800/80 focus:border-indigo-500/50 focus:bg-zinc-900 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-zinc-100 placeholder-zinc-600 outline-none text-sm font-medium transition-all duration-300 disabled:opacity-50"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            {isFetching ? (
              <div className="px-3 py-1.5 flex items-center space-x-2 text-indigo-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
            ) : url.trim() && !videoInfo && (
              <button
                type="button"
                onClick={fetchVideoInfo}
                disabled={isFetching || isConverting}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                Fetch
              </button>
            )}
          </div>
        </div>

        {infoError && (
          <div className="flex items-center space-x-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg animate-enter absolute -bottom-10 left-0 right-0 z-10">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{infoError}</span>
          </div>
        )}
      </div>

      {/* Video Preview */}
      {videoInfo && !isConverting && (
        <div className="animate-enter bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden p-3 flex flex-col sm:flex-row gap-4 items-start sm:items-center relative group hover:bg-zinc-900/60 transition-colors">
          <button 
            onClick={() => setVideoInfo(null)}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800/0 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all text-[10px] font-medium"
          >
            Change
          </button>
          
          {videoInfo.thumbnail && !thumbnailError ? (
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-full sm:w-32 h-20 object-cover rounded-xl shrink-0 border border-zinc-800/50 shadow-sm"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <div className="w-full sm:w-32 h-20 bg-zinc-950 rounded-xl shrink-0 flex items-center justify-center border border-zinc-800/50">
              <Music className="w-5 h-5 text-zinc-700" />
            </div>
          )}

          <div className="flex-1 space-y-2 min-w-0 pr-8">
            <h4 className="font-semibold text-zinc-100 text-sm line-clamp-2 leading-tight">
              {videoInfo.title}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-zinc-600" />
                <span>{videoInfo.author}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                <span>{videoInfo.durationFormatted}</span>
              </span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 hover:text-indigo-400 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Source</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Quality Picker & Convert Action */}
      {videoInfo && !isConverting && (
        <div className="space-y-5 pt-2 animate-enter">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/30 p-2 rounded-xl border border-zinc-800/50">
            <span className="text-xs font-semibold text-zinc-400 px-2 uppercase tracking-wider">Audio Quality</span>
            <div className="flex p-1 bg-zinc-900 rounded-lg">
              {["128", "192", "256", "320"].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setBitrate(q)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                    bitrate === q
                      ? "bg-zinc-800 text-indigo-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {q}
                  <span className="text-[10px] opacity-70 ml-0.5">kbps</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleConvert}
            className="w-full py-4 rounded-xl brand-btn font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 cursor-pointer flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Convert to MP3</span>
          </button>
        </div>
      )}

      {/* Converting State */}
      {isConverting && (
        <div className="animate-enter flex flex-col items-center justify-center py-8 space-y-6 bg-zinc-900/30 rounded-2xl border border-indigo-500/20">
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 relative z-10">
              <div className="flex items-end space-x-1 h-4">
                <div className="wave-bar wave-bar-1"></div>
                <div className="wave-bar wave-bar-2"></div>
                <div className="wave-bar wave-bar-3"></div>
                <div className="wave-bar wave-bar-4"></div>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-1.5">
            <h4 className="text-sm font-semibold text-indigo-300 tracking-wide">{conversionPhase}</h4>
            <p className="text-xs text-zinc-500 font-medium">Extracting {bitrate}kbps audio via FFmpeg</p>
          </div>
        </div>
      )}
    </div>
  );
}
