/**
 * File Metadata Model
 * Represents converted audio file metadata
 */

class FileMetadata {
  /**
   * @param {object} params
   * @param {string} params.filename - Unique filename generated for converted output (e.g., <uuid>.mp3)
   * @param {string} params.downloadUrl - Absolute download URL
   * @param {string} params.size - Human-readable size (e.g., 14.5 MB)
   * @param {number} params.sizeBytes - Size in bytes
   * @param {string} params.duration - Human-readable duration (e.g., 03:45)
   * @param {number} params.durationSeconds - Duration in seconds
   * @param {string} params.bitrate - Audio bitrate (e.g., 320k)
   * @param {Date} [params.createdAt] - Creation timestamp
   */
  constructor({ filename, downloadUrl, size, sizeBytes, duration, durationSeconds, bitrate, createdAt }) {
    this.filename = filename;
    this.downloadUrl = downloadUrl;
    this.size = size;
    this.sizeBytes = sizeBytes;
    this.duration = duration;
    this.durationSeconds = durationSeconds;
    this.bitrate = bitrate;
    this.createdAt = createdAt || new Date();
  }

  /**
   * Convert model instance to API response DTO
   */
  toApiResponse() {
    return {
      success: true,
      filename: this.filename,
      downloadUrl: this.downloadUrl,
      size: this.size,
      duration: this.duration,
      bitrate: this.bitrate
    };
  }
}

module.exports = FileMetadata;
