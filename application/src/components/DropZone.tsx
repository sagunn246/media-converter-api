"use client";

import { useState, useRef } from "react";
import { Upload, FileVideo, FileAudio, X, Play, Loader2 } from "lucide-react";
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
      const response = await fetch("/api/backend/api/convert", {
        method: "POST",
        body: formData,
      });

      const result = await safeParseResponse(response);

      if (response.ok && result.success) {
        const payload = result.data || (result as unknown as ConvertedTrack);
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "") + ".mp3";

        onConvertSuccess({
          ...payload,
          filename: cleanName,
          bitrate: `${bitrate}k`,
        });
      } else if (response.status === 504 || response.status === 502) {
        // Next.js proxy timeout or socket hangup, conversion is likely still running in backend
        onConvertError("Conversion is taking longer than expected. It is processing in the background and will appear in history shortly.");
        setSelectedFile(null);
      } else {
        const errorMsg = result.error || result.message || "File conversion failed.";
        onConvertError(errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error during conversion.";
      onConvertError(errorMsg);
    } finally {
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

  return (
    <div className="space-y-5">
      {/* Drop Zone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : selectedFile
            ? "border-emerald-500/40 bg-zinc-900/80"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/70"
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
          <div className="space-y-2 py-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center border border-zinc-700/60">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-200">
                Drag and drop media file here
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                or <span className="text-indigo-400 font-medium hover:underline">choose file from computer</span>
              </p>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              MP4, MOV, WEBM, MKV, AVI, WAV, MP3 • Max 500MB
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-1">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                {selectedFile.type.startsWith("video") ? (
                  <FileVideo className="w-4 h-4" />
                ) : (
                  <FileAudio className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-100 text-xs truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
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
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quality Picker & Action */}
      {selectedFile && (
        <div className="space-y-4 pt-2 border-t border-zinc-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Bitrate / Quality</span>
            <div className="flex gap-1.5">
              {["128", "192", "256", "320"].map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setBitrate(q)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
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
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg brand-btn font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing File...</span>
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
