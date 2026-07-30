"use client";

import { useState, useRef } from "react";
import { Upload, FileVideo, FileAudio, CheckCircle2, AlertCircle, Sparkles, X, SlidersHorizontal } from "lucide-react";

interface DropZoneProps {
  onConvertStart: () => void;
  onConvertSuccess: (data: any) => void;
  onConvertError: (message: string) => void;
}

export default function DropZone({ onConvertStart, onConvertSuccess, onConvertError }: DropZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState<string>("320");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allowedFormats = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".mp3", ".wav", ".aac", ".m4a"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedFormats.includes(ext)) {
      onConvertError(`Unsupported file format (${ext}). Supported: ${allowedFormats.join(", ")}`);
      return;
    }

    const maxSizeMB = 500;
    if (file.size > maxSizeMB * 1024 * 1024) {
      onConvertError(`File size exceeds max limit of ${maxSizeMB} MB.`);
      return;
    }

    setSelectedFile(file);
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
    onConvertStart();

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("bitrate", bitrate);

    try {
      // Post to proxied endpoint
      const response = await fetch("/api/backend/api/convert", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onConvertSuccess(result.data);
      } else {
        const errorMsg = result.message || "Failed to convert file. Please try again.";
        onConvertError(errorMsg);
      }
    } catch (err: any) {
      onConvertError(err.message || "Network error while connecting to Media Converter API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
            : selectedFile
            ? "border-emerald-500/50 bg-slate-900/60"
            : "border-slate-800 hover:border-violet-500/50 bg-slate-900/40 hover:bg-slate-900/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedFormats.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 rounded-2xl glow-gradient mx-auto flex items-center justify-center shadow-xl shadow-violet-500/20">
              <Upload className="w-8 h-8 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Drag & Drop Video or Audio file here
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                or <span className="text-violet-400 font-semibold underline underline-offset-4">browse from device</span>
              </p>
            </div>
            <div className="inline-flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 px-4 py-1.5 rounded-full border border-slate-800">
              <span>Supported Formats: MP4, MOV, WEBM, MKV, AVI, WAV, MP3</span>
              <span>• Max 500MB</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                {selectedFile.type.startsWith("video") ? (
                  <FileVideo className="w-6 h-6" />
                ) : (
                  <FileAudio className="w-6 h-6" />
                )}
              </div>
              <div className="text-left">
                <p className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Bitrate & Action Settings */}
      {selectedFile && (
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <SlidersHorizontal className="w-5 h-5 text-violet-400" />
              <div>
                <label className="text-sm font-semibold text-white block">
                  Select Audio Quality (Bitrate)
                </label>
                <span className="text-xs text-slate-400">
                  Higher bitrates yield richer sound clarity
                </span>
              </div>
            </div>

            {/* Quality Selector Buttons */}
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

          {/* Convert Trigger Button */}
          <button
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full py-4 rounded-xl glow-gradient font-bold text-white shadow-xl shadow-violet-600/25 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing & Converting with FFmpeg...</span>
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
    </div>
  );
}
