# 🎵 AudioPulse - High-Performance Media Converter & YouTube MP3 Platform

**AudioPulse** is a production-ready, full-stack application for converting local audio/video media files and YouTube videos into studio-quality MP3 audio files (up to **320kbps**). 

The repository is built with a **modular architecture** cleanly separating the **Node.js/Express REST API backend** from the **Next.js 16 / React 19 Web Application frontend**.

---

## 📑 Table of Contents

- [What is AudioPulse?](#-what-is-audiopulse)
- [Technologies & Stack Used](#-technologies--stack-used)
- [Project Architecture & Directory Layout](#-project-architecture--directory-layout)
- [How It Works (Step-by-Step Data Flow)](#-how-it-works-step-by-step-data-flow)
  - [1. Local File Upload & Conversion Workflow](#1-local-file-upload--conversion-workflow)
  - [2. YouTube URL Audio Stream & Conversion Workflow](#2-youtube-url-audio-stream--conversion-workflow)
  - [3. Audio Streaming & Storage Retention Cleanup](#3-audio-streaming--storage-retention-cleanup)
- [Frontend Components Breakdown](#-frontend-components-breakdown)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Environment Variables](#-environment-variables)
- [Installation & Getting Started](#-installation--getting-started)
- [Security & Optimization Features](#-security--optimization-features)

---

## ❓ What is AudioPulse?

AudioPulse resolves the complex task of media transcoding into an effortless web interface:
1. **Local Media File Transcoding**: Users can upload any common audio or video file (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.wav`, `.aac`, `.m4a`, `.mp3`) up to **500 MB**, select an audio quality (128k, 192k, 256k, or 320k), and receive a transcode within seconds.
2. **YouTube Audio Transcoding**: Users can paste any YouTube video URL (`watch`, `shorts`, or `youtu.be`), preview metadata (thumbnail, channel name, video title, duration), and convert the YouTube stream to MP3.
3. **In-Browser Audio Player**: Streams the converted MP3 directly in the browser with full timeline seeking, audio volume controls, and track history tracking.

---

## 🛠️ Technologies & Stack Used

### 🟢 Backend REST API (`/api`)
- **Node.js & Express.js**: Asynchronous event-driven web server framework.
- **FFmpeg (`fluent-ffmpeg`)**: Native media processor using `@ffmpeg-installer/ffmpeg` and `@ffprobe-installer/ffprobe` binaries for cross-platform transcoding without requiring manual local FFmpeg installation.
- **`@distube/ytdl-core`**: High-performance YouTube audio streaming utility.
- **Multer**: Disk-storage multipart form handler for multi-megabyte file uploads.
- **Node-Cron**: Automated job scheduler running hourly retention purges for expired files.
- **Security & Utilities**:
  - `helmet`: Protects HTTP response headers.
  - `cors`: Enables Cross-Origin Resource Sharing.
  - `express-rate-limit`: Prevents API abuse and Denial of Service (DoS).
  - `compression`: Gzip response compression.
  - `uuid`: Generates cryptographically secure unique identifiers for files.
  - `dotenv`: Environment variable management.

### 🔵 Web Application Frontend (`/application`)
- **Next.js 16 (App Router & Turbopack)**: Modern React framework with Next.js API proxy rewrites.
- **React 19 & TypeScript 5**: Type-safe component architecture.
- **Tailwind CSS 4**: Utility-first CSS styling with custom glassmorphism and animated glows.
- **Lucide React**: Modern iconography system.

---

## 🏗️ Project Architecture & Directory Layout

The codebase separates backend API logic from client UI code:

```
media-converter-api/
├── api/                            # 🟢 REST API Backend (Express.js + FFmpeg)
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js        # Allowed file formats, MIME types, max file size, bitrates
│   │   │   └── env.config.js       # Environment configuration & validation
│   │   ├── controllers/
│   │   │   ├── api.controller.js   # GET / and GET /health route controllers
│   │   │   ├── convert.controller.js # POST /api/convert controller (local file upload)
│   │   │   ├── download.controller.js# GET /api/download/:filename controller (HTTP Range stream)
│   │   │   ├── file.controller.js    # DELETE /api/file/:filename controller
│   │   │   └── youtube.controller.js # GET /api/youtube/info & POST /api/youtube/convert
│   │   ├── middleware/
│   │   │   ├── error.middleware.js   # 404 handler & centralized error response pipeline
│   │   │   ├── rateLimiter.middleware.js # Rate limiters for general API & conversion tasks
│   │   │   ├── upload.middleware.js  # Multer disk storage config & MIME file filters
│   │   │   └── validate.middleware.js# Input parameter validation (bitrate checks)
│   │   ├── models/
│   │   │   └── fileMetadata.model.js # DTO schema model for converted file responses
│   │   ├── routes/                 # Express router declarations
│   │   │   ├── api.routes.js
│   │   │   ├── convert.routes.js
│   │   │   ├── download.routes.js
│   │   │   ├── file.routes.js
│   │   │   ├── youtube.routes.js
│   │   │   └── index.js            # Central route aggregator
│   │   ├── services/
│   │   │   ├── ffmpeg.service.js   # FFmpeg media transcoding & FFprobe metadata service
│   │   │   ├── storage.service.js  # Directory init, safe path checks & cron cleanup
│   │   │   └── ytdl.service.js     # YouTube metadata lookup & audio stream transcoding
│   │   ├── utils/
│   │   │   ├── apiError.js         # Custom operational error class
│   │   │   ├── apiResponse.js      # Standardized API response formatters
│   │   │   ├── fileHelpers.js     # Byte/duration formatters & file deletion helpers
│   │   │   └── logger.js           # Structured console logger with Morgan integration
│   │   ├── app.js                  # Express app initialization & middleware stack
│   │   └── server.js               # Entry point, HTTP listener, cron startup & shutdown
│   ├── uploads/                    # Temporary uploaded files directory
│   ├── output/                     # Transcoded MP3 files retention storage
│   ├── .env                        # API configuration file
│   └── package.json                # API dependencies & execution scripts
│
├── application/                    # 🔵 Web Application Frontend (Next.js 16)
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # Custom Tailwind styles & animations
│   │   │   ├── layout.tsx          # Root HTML layout with Google Fonts
│   │   │   └── page.tsx            # Main application homepage
│   │   └── components/
│   │       ├── AudioPlayer.tsx     # Custom audio player with seekbar & volume controls
│   │       ├── DropZone.tsx        # Drag-and-drop file upload component
│   │       ├── Header.tsx          # Navigation header with real-time API status check
│   │       ├── HistoryList.tsx     # Recent conversion history list
│   │       └── YoutubeConverter.tsx# YouTube link parser & converter component
│   ├── next.config.ts              # Next.js API proxy rewrites (/api/backend/* -> http://localhost:3000/*)
│   └── package.json                # Frontend dependencies & scripts
│
├── package.json                    # Workspace root manager (runs both API and App)
└── .gitignore                      # Git exclusion rules
```

---

## 🔄 How It Works (Step-by-Step Data Flow)

### 1. Local File Upload & Conversion Workflow

```
[ User ] --(Drag & Drop File)--> [ DropZone.tsx ]
                                       |
                                       v (POST /api/backend/api/convert)
                             [ Next.js Proxy Rewrite ]
                                       |
                                       v (Forwarded to http://localhost:3000/api/convert)
                            [ upload.middleware.js ]
                                       |
                   (Validates MIME type & File Extension)
                                       |
                                       v (Saves file to api/uploads/<uuid>.<ext>)
                          [ convert.controller.js ]
                                       |
                                       v
                           [ ffmpeg.service.js ]
                                       |
           (Transcodes via fluent-ffmpeg with libmp3lame codec)
                                       |
                                       v (Outputs to api/output/<uuid>.mp3)
                     [ Delete original file from api/uploads/ ]
                                       |
                                       v (Extract metadata via ffprobe)
                      [ Return JSON DTO to Client ]
```

1. **Selection**: User drops a media file (e.g. `sample.mp4`) into `DropZone.tsx` and chooses a target bitrate (e.g., `320k`).
2. **Upload**: Frontend sends `multipart/form-data` to `/api/backend/api/convert`.
3. **Filtering**: Multer verifies that the extension is supported and the size is under **500 MB**, saving the file to `api/uploads/<uuid>.<ext>`.
4. **Transcoding**: `ffmpeg.service.js` launches an FFmpeg child process executing:
   ```bash
   ffmpeg -i input.mp4 -f mp3 -acodec libmp3lame -b:a 320k output.mp3
   ```
5. **Immediate Cleanup**: The original file in `api/uploads/` is unlinked asynchronously.
6. **Metadata**: FFprobe reads the output file's exact duration and file size, returning a response object:
   ```json
   {
     "success": true,
     "data": {
       "filename": "a1b2c3d4-5678-90ef.mp3",
       "downloadUrl": "http://localhost:3000/api/download/a1b2c3d4-5678-90ef.mp3",
       "size": "9.45 MB",
       "sizeBytes": 9909043,
       "duration": "04:08",
       "durationSeconds": 248,
       "bitrate": "320k"
     }
   }
   ```

---

### 2. YouTube URL Audio Stream & Conversion Workflow

```
[ User ] --(Paste YouTube Link)--> [ YoutubeConverter.tsx ]
                                           |
                                           v (Click "Fetch")
                               [ GET /api/youtube/info?url=... ]
                                           |
                                           v
                                  [ ytdl.service.js ]
                        (Retrieves Title, Channel, Duration, Thumbnail)
                                           |
                                           v
                            [ Preview Card rendered in UI ]
                                           |
                                           v (Click "Convert")
                             [ POST /api/youtube/convert ]
                                           |
                                           v
                              [ ytdl audioonly Stream ]
                                           |
                                           v (Piped directly into FFmpeg)
                                  [ ffmpeg.service.js ]
                                           |
                                           v (Outputs to api/output/<uuid>.mp3)
                          [ Return JSON DTO to Client ]
```

1. **Info Lookup**: User enters a YouTube link and clicks **Fetch**. The backend uses `@distube/ytdl-core` to retrieve video metadata without downloading the full video.
2. **Streaming Transcode**: Upon clicking **Convert**, `ytdl.service.js` creates a readable audio stream (`audioonly` filter) and pipes it directly into FFmpeg in memory, eliminating the need to save intermediate video files.
3. **Completion**: FFmpeg converts the incoming stream directly into `api/output/<uuid>.mp3` and returns metadata to the client.

---

### 3. Audio Streaming & Storage Retention Cleanup

- **Streaming (`GET /api/download/:filename`)**:
  The download controller uses Express `res.sendFile()`, supporting standard **HTTP 206 Partial Content Range headers**. This allows users to skip forward/backward in the `AudioPlayer` component without downloading the full file first.
- **Automated Retention Purge**:
  `storage.service.js` registers a cron job (`node-cron`) running on the schedule specified in `CLEANUP_CRON_SCHEDULE` (default: hourly). Any output file in `api/output/` with a modification timestamp (`mtime`) older than `FILE_RETENTION_HOURS` (default: 24 hours) is deleted automatically.

---

## 🎨 Frontend Components Breakdown

| Component | Responsibility |
| :--- | :--- |
| `Header.tsx` | Sticky navigation header with real-time polling to `/api/backend/health` showing API connectivity status. |
| `DropZone.tsx` | Drag-and-drop file uploader with extension validation, file size checks, and bitrate picker (128k, 192k, 256k, 320k). |
| `YoutubeConverter.tsx` | YouTube link validator, video info previewer (thumbnail, title, channel, duration), and conversion starter. |
| `AudioPlayer.tsx` | Feature-rich audio player with play/pause controls, interactive seek bar, volume control, mute toggle, track metadata display, and instant download button. |
| `HistoryList.tsx` | Persistent conversion history stored in browser `localStorage`, allowing users to re-play or re-download recent tracks. |

---

## 🌐 API Endpoints Reference

### Base URL: `http://localhost:3000`

#### 1. System Health & Operational Status
- **`GET /`**
  - Response: Returns operational status and available endpoint list.
- **`GET /health`**
  - Response: `{ "success": true, "status": "UP", "uptime": 124.5 }`

#### 2. Local Media Transcoding
- **`POST /api/convert`**
  - **Content-Type**: `multipart/form-data`
  - **Body Parameters**:
    - `file` (File, Required): Media file (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.mp3`, `.wav`, `.aac`, `.m4a`).
    - `bitrate` (String, Optional): Desired bitrate (`128`, `192`, `256`, `320`). Default: `320`.

#### 3. YouTube Transcoding
- **`GET /api/youtube/info?url=<YOUTUBE_URL>`**
  - **Query Parameters**: `url` (Required YouTube video URL).
  - **Response**: `{ "success": true, "data": { "title": "...", "author": "...", "durationFormatted": "03:45", "thumbnail": "..." } }`
- **`POST /api/youtube/convert`**
  - **Content-Type**: `application/json`
  - **Body**: `{ "url": "https://www.youtube.com/watch?v=...", "bitrate": "320" }`

#### 4. Streaming & Download
- **`GET /api/download/:filename`**
  - Stream or download converted MP3 file. Supports Range headers (`bytes=0-`).

#### 5. Deletion
- **`DELETE /api/file/:filename`**
  - Manually delete converted file from storage.

---

## ⚙️ Environment Variables

The backend API is configured via `api/.env`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP Port for Express API server |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `APP_BASE_URL` | `http://localhost:3000` | Base URL used to construct download links |
| `MAX_FILE_SIZE_MB` | `500` | Maximum upload file size limit in megabytes |
| `FILE_RETENTION_HOURS` | `24` | Hours to retain converted output files before cron deletion |
| `CLEANUP_CRON_SCHEDULE` | `0 * * * *` | Cron schedule for cleanup job (Default: top of every hour) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window in milliseconds (15 minutes) |
| `RATE_LIMIT_MAX_GENERAL` | `100` | Max request count per window for general routes |
| `RATE_LIMIT_MAX_CONVERT` | `10` | Max request count per window for conversion routes |

---

## 🚀 Installation & Getting Started

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/sagunn246/media-converter-api.git
cd media-converter-api

# Install API backend dependencies
cd api && npm install && cd ..

# Install Web Application frontend dependencies
cd application && npm install && cd ..
```

### 2. Start Development Mode

Run both the Express API (Port 3000) and Next.js Frontend (Port 3001) concurrently with a single command from the root directory:

```bash
npm run dev
```

Open your browser at:
👉 **`http://localhost:3001`** (Web Application Interface)
👉 **`http://localhost:3000`** (REST API Backend)

---

## 🛡️ Security & Optimization Features

1. **Path Traversal Shield**: All file access requests go through `sanitizeFilename()` and path resolution checks, ensuring no user can download or delete files outside `api/output/`.
2. **Memory Efficiency**: YouTube streams are piped straight into FFmpeg processes without storing intermediate video files on disk.
3. **Automatic Cleanup**: Uploaded input files are unlinked immediately after conversion completes; converted output files are cleaned up after 24 hours.
4. **Rate Limiting**: CPU-intensive conversion endpoints are limited to 10 requests per 15-minute window per IP to safeguard server CPU resources.
