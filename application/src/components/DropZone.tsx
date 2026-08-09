"use client";

import { useState, useRef } from "react";
import { Upload, FileVideo, FileAudio, X, Play, Loader2, Download } from "lucide-react";
import { ConvertedTrack, ApiResponse } from "@/types";

interface DropZoneProps {
  onConvertStart: () => void;
  onConvertSuccess: (data: ConvertedTrack) => void;
  onConvertError: (message: string) => void;
}

export default function DropZone({ onConvertStart, onConvertSuccess, onConvertError }: DropZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState<string>("320");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<ConvertedTrack | null>(null);
  const [conversionPhase, setConversionPhase] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allowedFormats = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".mp3", ".wav", ".aac", ".m4a"];

  const safeParseResponse = async (response: Response): Promise<ApiResponse<ConvertedTrack>> => {
    const text = await response.text();
    if (!text || !text.trim()) {
      return { success: false, error: `Empty response received from server (${response.status}).` };
    }
    try {
      return JSON.parse(text);
    } catch {
      if (!response.ok) {
        return { success: false, error: `Server error (${response.status}). Please try again.` };
      }
      return { success: false, error: "Invalid response format received from server." };
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!allowedFormats.includes(ext)) {
      onConvertError(`Unsupported format (${ext}). Allowed: ${allowedFormats.join(", ")}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxSizeMB = 500;
    if (file.size > maxSizeMB * 1024 * 1024) {
      onConvertError(`File exceeds ${maxSizeMB} MB limit.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    setSuccessData(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    setConversionPhase("Uploading media...");
    onConvertStart();

    const phases = ["Extracting audio...", "Converting to MP3...", "Finalizing metadata..."];
    let phaseIndex = 0;
    const phaseInterval = setInterval(() => {
      if (phaseIndex < phases.length) {
        setConversionPhase(phases[phaseIndex]);
        phaseIndex++;
      }
    }, 4000);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("bitrate", bitrate);

    try {
      const response = await fetch("/api/backend/api/convert", {
        method: "POST",
        body: formData,
      });

      clearInterval(phaseInterval);
      const result = await safeParseResponse(response);

      if (response.ok && result.success) {
        const payload = result.data || (result as unknown as ConvertedTrack);
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "") + ".mp3";

        const finalData = {
          ...payload,
          filename: cleanName,
          bitrate: `${bitrate}k`,
        };

        setSuccessData(finalData);
        onConvertSuccess(finalData);
      } else if (
        response.status === 504 || 
        response.status === 502 || 
        (response.status === 500 && result.error?.includes("Server returned error (500)"))
      ) {
        onConvertError("Conversion is taking longer than expected. It is processing in the background and will appear in history shortly.");
        setSelectedFile(null);
      } else {
        const errorMsg = result.error || result.message || "File conversion failed.";
        onConvertError(errorMsg);
      }
    } catch (err: unknown) {
      clearInterval(phaseInterval);
      const errorMsg = err instanceof Error ? err.message : "Network error during conversion.";
      onConvertError(errorMsg);
    } finally {
      clearInterval(phaseInterval);
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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
              setSelectedFile(null);
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
      {/* Drop Zone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isSubmitting && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]"
            : selectedFile
            ? "border-emerald-500/40 bg-zinc-900/80 cursor-default"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/70 cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedFormats.join(",")}
          onChange={handleFileChange}
          disabled={isSubmitting}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="space-y-3 py-2 pointer-events-none">
            <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center transition-all duration-500 ${
              isDragging ? "bg-indigo-600/30 text-indigo-400 scale-110 shadow-lg shadow-indigo-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
            }`}>
              <Upload className={`w-6 h-6 transition-transform duration-300 ${isDragging ? "-translate-y-1" : ""}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Drop your media here
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                or <span className="text-indigo-400 font-medium group-hover:underline">click to browse</span>
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono pt-1">
              MP4, MOV, WEBM, MKV, AVI, WAV, MP3 • Max 500MB
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 animate-enter bg-zinc-900/60 rounded-xl border border-zinc-700/50 shadow-sm">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                {selectedFile.type.startsWith("video") ? (
                  <FileVideo className="w-5 h-5" />
                ) : (
                  <FileAudio className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-100 text-sm truncate max-w-[200px] sm:max-w-sm">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => {
                e.stopPropagation();
                removeSelectedFile();
              }}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quality Picker & Action */}
      {selectedFile && !isSubmitting && (
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
            onClick={handleSubmit}
            className="w-full py-4 rounded-xl brand-btn font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 cursor-pointer flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Convert to MP3</span>
          </button>
        </div>
      )}

      {/* Converting State */}
      {isSubmitting && (
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
