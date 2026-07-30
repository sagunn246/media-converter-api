# Media Converter REST API

A scalable, production-ready REST API built with Node.js, Express, Multer, and FFmpeg for converting user-uploaded video or audio files into high-quality MP3 format.

---

## Features

- 🎧 **Media Conversion**: Converts video/audio files (`mp4`, `mov`, `avi`, `mkv`, `webm`, `mp3`, `wav`, `aac`, `m4a`) to MP3.
- ⚡ **Configurable Bitrates**: Supports `128k`, `192k`, `256k`, and `320k` (Default: `320k`).
- 📁 **Large File Support**: Handles uploads up to **500 MB**.
- 🔒 **Security Hardened**: Protected with Helmet, CORS, Rate Limiting, input sanitization, and path traversal prevention.
- 🧹 **Automated Storage Cleanup**:
  - Immediate removal of original temporary uploads after processing.
  - Automated cron job removing converted output files older than **24 hours**.
- 🎵 **HTTP Range Streaming**: Enables streaming and playback of MP3 files directly via download links.
- 🏗️ **Clean Architecture**: Follows MVC design pattern, async/await, centralized error handling, and structured logging.

---

## Folder Structure

```
media-converter-api/
├── src/
│   ├── config/
│   │   ├── constants.js          # Supported extensions, mime types, max size, bitrates
│   │   └── env.config.js         # Environment variable validation & exports
│   ├── controllers/
│   │   ├── api.controller.js     # GET / and GET /health handlers
│   │   ├── convert.controller.js # POST /api/convert handler
│   │   ├── download.controller.js# GET /api/download/:filename handler
│   │   └── file.controller.js    # DELETE /api/file/:filename handler
│   ├── middleware/
│   │   ├── error.middleware.js   # Centralized 404 & error handlers
│   │   ├── rateLimiter.middleware.js # Express rate limiting rules
│   │   ├── upload.middleware.js  # Multer storage, size & format filter
│   │   └── validate.middleware.js# Parameter validation middleware
│   ├── models/
│   │   └── fileMetadata.model.js # Data model for converted file response DTO
│   ├── routes/
│   │   ├── api.routes.js         # Root & health endpoints
│   │   ├── convert.routes.js     # /api/convert route
│   │   ├── download.routes.js    # /api/download route
│   │   ├── file.routes.js        # /api/file route
│   │   └── index.js              # Central route aggregator
│   ├── services/
│   │   ├── ffmpeg.service.js     # FFmpeg conversion & ffprobe metadata extraction
│   │   └── storage.service.js    # Directory init, path security, 24h cron cleanup
│   ├── utils/
│   │   ├── apiError.js           # Custom operational error class
│   │   ├── apiResponse.js        # Standardized JSON response helper
│   │   ├── fileHelpers.js       # Size/duration formatters & path sanitizers
│   │   └── logger.js             # Structured console logging & Morgan stream
│   ├── app.js                    # Express app initialization & middleware pipeline
│   └── server.js                 # Server entry point, cron startup, graceful shutdown
├── uploads/                      # Storage for temporary user uploads
├── output/                       # Storage for converted MP3 files
├── postman_collection.json       # Exported Postman Collection (v2.1)
├── package.json
├── .env.example
└── README.md
```

---

## Prerequisites & System Dependencies

- **Node.js**: `v18.0.0` or higher (LTS recommended)
- **npm**: `v8.0.0` or higher
- **FFmpeg**: 
  - *Note*: This project bundles `@ffmpeg-installer/ffmpeg` and `@ffprobe-installer/ffprobe` as fallbacks so it works out-of-the-box.
  - For optimal production performance, installing global FFmpeg is recommended:
    - **Windows**: `winget install FFmpeg` or `choco install ffmpeg`
    - **macOS**: `brew install ffmpeg`
    - **Linux (Ubuntu/Debian)**: `sudo apt update && sudo apt install -y ffmpeg`

---

## Installation Instructions

1. **Clone or Navigate to the project directory**:
   ```bash
   cd media-converter-api
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Start the API Server**:
   - **Development Mode** (with hot reload via nodemon):
     ```bash
     npm run dev
     ```
   - **Production Mode**:
     ```bash
     npm start
     ```

Server will start on `http://localhost:3000`.

---

## Environment Variables (`.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP Server port |
| `NODE_ENV` | `development` | Application environment (`development` / `production`) |
| `APP_BASE_URL` | `http://localhost:3000` | Base URL used to generate download URLs |
| `MAX_FILE_SIZE_MB` | `500` | Maximum upload size limit in Megabytes |
| `UPLOAD_DIR` | `uploads` | Path for temporary raw file uploads |
| `OUTPUT_DIR` | `output` | Path for converted MP3 output files |
| `FILE_RETENTION_HOURS` | `24` | Automated cleanup threshold in hours |
| `CLEANUP_CRON_SCHEDULE` | `0 * * * *` | Cron schedule for cleanup task (every hour) |

---

## API Documentation

### 1. Root API Status
Returns current API operational status and supported endpoint index.

- **Method**: `GET`
- **Path**: `/`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Media Converter REST API is operational",
    "version": "1.0.0",
    "endpoints": {
      "health": "GET /health",
      "convert": "POST /api/convert (multipart/form-data with \"file\" and optional \"bitrate\")",
      "download": "GET /api/download/:filename",
      "delete": "DELETE /api/file/:filename"
    },
    "timestamp": "2026-07-30T12:00:00.000Z"
  }
  ```

---

### 2. Health Check
Monitoring health check endpoint.

- **Method**: `GET`
- **Path**: `/health`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "status": "UP",
    "uptime": 124.56,
    "timestamp": "2026-07-30T12:00:00.000Z"
  }
  ```

---

### 3. Convert Media File
Uploads a video or audio file and converts it into MP3 format.

- **Method**: `POST`
- **Path**: `/api/convert`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file` *(required)*: Binary audio or video file (`mp4`, `mov`, `avi`, `mkv`, `webm`, `mp3`, `wav`, `aac`, `m4a` up to 500MB).
  - `bitrate` *(optional)*: Target MP3 audio bitrate in kbps (`128`, `192`, `256`, `320`). Default: `320`.

- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "filename": "e9b4d8a1-7c2a-4b92-91e8-1a2b3c4d5e6f.mp3",
    "downloadUrl": "http://localhost:3000/api/download/e9b4d8a1-7c2a-4b92-91e8-1a2b3c4d5e6f.mp3",
    "size": "14.50 MB",
    "duration": "03:45",
    "bitrate": "320k"
  }
  ```

- **Error Responses**:
  - `400 Bad Request` (Unsupported format or missing file field):
    ```json
    {
      "success": false,
      "error": "Unsupported file format 'txt'. Supported formats are: mp4, mov, avi, mkv, webm, mp3, wav, aac, m4a"
    }
    ```
  - `400 Bad Request` (Exceeding max size 500MB):
    ```json
    {
      "success": false,
      "error": "Uploaded file exceeds maximum allowed size of 500 MB"
    }
    ```

---

### 4. Download / Stream MP3 File
Streams or downloads a converted MP3 file by filename. Supports HTTP Range requests for streaming playback.

- **Method**: `GET`
- **Path**: `/api/download/:filename`
- **Response** (`200 OK` / `206 Partial Content`): Binary MP3 audio stream (`Content-Type: audio/mpeg`).
- **Error Response** (`404 Not Found`):
  ```json
  {
    "success": false,
    "error": "Requested file 'e9b4d8a1-7c2a-4b92-91e8-1a2b3c4d5e6f.mp3' was not found or has expired"
  }
  ```

---

### 5. Delete Converted File
Deletes a converted MP3 file from storage manually.

- **Method**: `DELETE`
- **Path**: `/api/file/:filename`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "File 'e9b4d8a1-7c2a-4b92-91e8-1a2b3c4d5e6f.mp3' deleted successfully"
  }
  ```

---

## Example `curl` Commands

### 1. Root & Health Check
```bash
# Get API Status
curl -X GET http://localhost:3000/

# Health Check
curl -X GET http://localhost:3000/health
```

### 2. Convert Video/Audio to MP3 (Default 320k)
```bash
curl -X POST http://localhost:3000/api/convert \
  -F "file=@/path/to/sample_video.mp4"
```

### 3. Convert Media to MP3 with Custom Bitrate (192k)
```bash
curl -X POST http://localhost:3000/api/convert \
  -F "file=@/path/to/sample_audio.wav" \
  -F "bitrate=192"
```

### 4. Download Converted File
```bash
curl -X GET http://localhost:3000/api/download/e9b4d8a1-7c2a-4b92-91e8-1a2b3c4d5e6f.mp3 \
  --output converted_output.mp3
```

### 5. Delete Converted File
```bash
curl -X DELETE http://localhost:3000/api/file/e9b4d8a1-7c2a-4b92-91e8-1a2b3c4d5e6f.mp3
```

---

## Postman Collection

Import `postman_collection.json` into Postman to test all endpoints.
1. Open Postman -> Click **Import**.
2. Select `postman_collection.json`.
3. Set the `baseUrl` collection variable if running on a custom port/host.

---

## License

MIT License.
