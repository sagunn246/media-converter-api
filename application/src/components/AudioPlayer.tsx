"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, Volume2, VolumeX, Music, Disc3, Sparkles } from "lucide-react";

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

  const getProxiedUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const parsed = new URL(url);
        return `/api/backend${parsed.pathname}`;
      } catch (e) {
        return url;
      }
    }
    return url;
  };

  const mediaUrl = getProxiedUrl(downloadUrl);

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
    <div className="glass-panel p-6 rounded-2xl border border-violet-500/30 relative overflow-hidden shadow-2xl">
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <audio ref={audioRef} src={mediaUrl} preload="metadata" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Track Metadata */}
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center glow-gradient shadow-lg transition-transform ${isPlaying ? "scale-105" : ""}`}>
              {isPlaying ? (
                <Disc3 className="w-7 h-7 text-white animate-spin" style={{ animationDuration: "3s" }} />
              ) : (
                <Music className="w-7 h-7 text-white" />
              )}
            </div>
            {/* Wave animation bars when playing */}
            {isPlaying && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end space-x-0.5 px-1 py-0.5 bg-slate-950/80 rounded-full">
                <div className="w-1 bg-violet-400 rounded-full wave-bar-1"></div>
                <div className="w-1 bg-fuchsia-400 rounded-full wave-bar-2"></div>
                <div className="w-1 bg-pink-400 rounded-full wave-bar-3"></div>
                <div className="w-1 bg-indigo-400 rounded-full wave-bar-4"></div>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-white text-base truncate max-w-xs sm:max-w-md">
              {filename}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono font-medium border border-violet-500/30">
                {bitrate} MP3
              </span>
              {size && <span className="text-xs text-slate-400 font-mono">{size}</span>}
              {duration && <span className="text-xs text-slate-400 font-mono">• {duration}</span>}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <a
            href={mediaUrl}
            download
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl glow-gradient font-semibold text-white shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download MP3</span>
          </a>
        </div>
      </div>

      {/* Seek Timeline */}
      <div className="mt-6 space-y-2">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={totalDuration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400 transition-all"
          />
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center space-x-3">
            {/* Play/Pause control */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Volume control */}
            <div className="hidden sm:flex items-center space-x-2">
              <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>
          </div>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
