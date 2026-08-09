/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, Volume2, VolumeX, Music } from "lucide-react";

interface AudioPlayerProps {
  filename: string;
  downloadUrl: string;
  duration?: string;
  durationSeconds?: number;
  size?: string;
  bitrate?: string;
}

export default function AudioPlayer({
  filename,
  downloadUrl,
  duration,
  durationSeconds,
  size,
  bitrate = "320k",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

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

  const mediaUrl = getProxiedUrl(downloadUrl);
  const downloadFileUrl = getProxiedUrl(downloadUrl, true);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setTotalDuration(durationSeconds || 0);
  }, [downloadUrl, durationSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [downloadUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="card-panel p-5 rounded-xl border border-zinc-800 space-y-4">
      <audio ref={audioRef} src={mediaUrl} preload="metadata" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Track Details */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Music className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h4 className="font-semibold text-zinc-100 text-xs truncate">
              {filename}
            </h4>
            <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-zinc-400 font-mono">
              <span className="text-indigo-400 font-medium">{bitrate} MP3</span>
              {size && <span>• {size}</span>}
              {duration && <span>• {duration}</span>}
            </div>
          </div>
        </div>

        {/* Primary Download Action */}
        <a
          href={downloadFileUrl}
          download={filename}
          className="px-4 py-2.5 rounded-lg brand-btn font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download MP3</span>
        </a>
      </div>

      {/* Progress & Controls */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/40">
        <input
          type="range"
          min={0}
          max={totalDuration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
        />

        <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
            </button>

            <div className="hidden sm:flex items-center space-x-1.5">
              <button onClick={toggleMute} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400"
              />
            </div>
          </div>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
