
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/wasal-logo.png">
    <img src="/wasal-logo.png" alt="وصال — Wesall" width="120" height="120">
  </picture>
</p>

<h1 align="center">وصال — Wesall ArSL Data Collection System</h1>

<p align="center">
  <em>Building the largest, highest-quality Arabic Sign Language (ArSL) video dataset — one validated recording at a time.</em>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Built%20with-Next.js%2016-000000?logo=next.js&logoColor=white" alt="Next.js 16"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Style-Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4"></a>
  <a href="https://developers.google.com/drive"><img src="https://img.shields.io/badge/Storage-Google%20Drive%20API-4285F4?logo=google-drive&logoColor=white" alt="Google Drive API"></a>
  <a href="https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker"><img src="https://img.shields.io/badge/AI-MediaPipe%20Pose-FF6F00?logo=mediapipe&logoColor=white" alt="MediaPipe Pose"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://github.com/Abdulrahman-M-Rezk/data_collection_Version-2"><img src="https://img.shields.io/badge/Status-Production%20Ready-22c55e" alt="Status"></a>
</p>

---

## الرؤية — Vision

Arabic Sign Language (ArSL) is the primary medium of communication for millions of Deaf individuals across the Arab world. Yet the field of Arabic Sign Language Processing (SLP) suffers from a critical shortage of **high-quality, structured, and ethically-collected video data**. Most existing datasets are small, uncontrolled, or not publicly available — stifling progress in sign recognition, translation, and accessibility technology.

**وصال (Wesall)** exists to bridge that gap. We provide a purpose-built, privacy-respecting platform that enables systematic collection of ArSL video data at scale, with real-time quality assurance at the point of capture. Every recording is validated for pose completeness before it leaves the contributor's device, ensuring that only training-ready samples enter the pipeline.

> *"وصال" — meaning connection, union, and linkage in Arabic — reflects our mission: connecting the Deaf community with technology, and connecting researchers with the data they need to build inclusive AI.*

---

## الميزات الأساسية — The 5 Pillars

### 1. 🏗️ Surgical Architecture
A modular Next.js 16 App Router application decomposed into single-responsibility custom hooks and domain-driven components. No global state store, no over-engineering — just clean separation of concerns.

```
hooks/useCamera.ts          →   Camera stream lifecycle & error handling
hooks/useRecording.ts       →   MediaRecorder orchestration & countdown
hooks/useUpload.ts          →   Google Drive upload with naming convention
hooks/usePoseDetection.ts   →   MediaPipe pose landmarker loop
hooks/useSignNavigation.ts  →   Reference video flow & session persistence
hooks/useUploadQueue.ts     →   IndexedDB-backed retry queue
```

### 2. 🤖 AI Gatekeeper (MediaPipe Pose Validation)
Before any recording is accepted, the system validates that the contributor's **shoulders, elbows, and wrists are fully visible** using real-time MediaPipe PoseLandmarker Lite. The record button is disabled when the pose is invalid, and Arabic-language feedback guides the contributor back into frame.

- **Preview mode:** 5 FPS detection (battery efficient)
- **Recording mode:** 15 FPS detection (high precision)
- **Threshold:** All 6 keypoints must have visibility ≥ 0.5

### 3. 💾 Zero Data Loss (IndexedDB Retry Queue)
If a network failure occurs during upload, the recording is never lost. The blob and metadata are persisted to an IndexedDB-backed queue. On the next page load, or when the browser detects network recovery (`online` event), all pending uploads are silently retried in the background.

- Offline resilience: survives page refresh and browser restart
- Automatic retry with exponential backoff (via read/remove pattern)
- Ambber badge in the header shows pending upload count at a glance

### 4. 🔒 Security-First Storage Architecture
Reference videos (public teaching materials) and collected uploads are stored in **two separate Google Drive folders** with distinct access levels:

| Zone | Access | Purpose |
|------|--------|---------|
| `REFERENCE_FOLDER_ID` | Public read | Demonstration videos shown to contributors |
| `UPLOAD_FOLDER_ID` | Restricted (API only) | Collected recordings, never publicly accessible |

Uploads are server-to-server authenticated via OAuth2 refresh tokens — no client-side credentials are ever exposed.

### 5. 📊 Observability (Async Batch Logging)
A lightweight, zero-dependency logging layer buffers events in memory and flushes to the server every 60 seconds (or when the buffer reaches 10 entries). All events are privacy-filtered — only the anonymized UUID and browser/OS info are transmitted.

Tracked metrics include:
- **Camera initialization failures** (by error type)
- **MediaPipe model load failures**
- **Upload success/failure** with file size and duration
- **Word skips** (user friction points)
- **Session completion** and **early exits**
- **Retry queue outcomes**

An admin stats endpoint (`/api/admin/stats`) returns:
- `totalVideosToday`, `uploadSuccessRate`, `averageSessionDurationMs`, `topDroppedSigns`

---

## 📛 Naming Convention Protocol

Every uploaded video file follows a **strict, parseable naming convention** that encodes all necessary metadata in the filename itself:

```
[Sign]_[Username]_[4-Char-UUID]_[Take].mp4
```

| Segment | Source | Example |
|---------|--------|---------|
| `Sign` | The Arabic word being signed | `انا` |
| `Username` | Contributor's chosen name (spaces → underscores) | `dalia` |
| `UUID` | 4-character alphanumeric, generated once per browser via `localStorage` | `a1b2` |
| `Take` | Auto-incrementing counter per (Sign, Username) pair, zero-padded | `01` |

**Example output:**
```
انا_dalia_a1b2_01.mp4
مدرسة_ahmed_x9k3_02.mp4
شكرا_omar_f4m7_01.mp4
```

This convention enables:
- **Deduplication** at the dataset level
- **Traceability** back to contributor (via UUID) without storing PII
- **Sorting** by sign, user, or take number
- **Machine-parseable** filenames for automated pipeline ingestion

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS 4 + tw-animate-css |
| **UI Library** | shadcn/ui primitives (Radix-based) |
| **Pose Detection** | @mediapipe/tasks-vision (PoseLandmarker Lite) |
| **Storage** | Google Drive API v3 (server-to-server OAuth2) |
| **Logging** | Custom async batch logger (no external deps) |
| **Deployment** | Vercel (via GitHub integration) |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── admin/stats/       # GET — protected metrics endpoint
│   │   ├── logs/              # POST — receive batched log entries
│   │   ├── reference-videos/  # GET — list public Drive folder
│   │   ├── upload/            # POST — upload to restricted Drive folder
│   │   └── user/              # POST — register contributor session
│   ├── layout.tsx
│   ├── page.tsx               # Orchestrator shell (step router)
│   └── globals.css
│
├── components/
│   ├── recording/
│   │   ├── WelcomeScreen.tsx      # Username entry
│   │   ├── InstructionsScreen.tsx # Paginated guidelines
│   │   ├── RecordingView.tsx      # Core camera + reference + controls
│   │   ├── Header.tsx             # Nav bar with stats badge
│   │   └── CompletionScreen.tsx   # Session summary
│   └── ui/                       # shadcn/ui primitives (60+ components)
│
├── hooks/
│   ├── useCamera.ts           # getUserMedia lifecycle
│   ├── useRecording.ts        # MediaRecorder + countdown
│   ├── useUpload.ts           # Naming convention + Drive upload
│   ├── usePoseDetection.ts    # MediaPipe detection loop + canvas overlay
│   ├── useSignNavigation.ts   # Word flow + session persistence
│   └── useUploadQueue.ts      # IndexedDB retry queue
│
├── services/
│   └── logger.ts              # Async batch logger singleton
│
├── config/
│   ├── signs.ts               # Word list + Sign type + Drive embed helper
│   └── env.example            # Environment variable reference
│
├── data/
│   └── database.json          # Session database (gitignored, ephemeral)
│
├── public/
│   ├── wasal-logo.png
│   └── ArSL_Recording_Guidelines_v2.html
│
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔧 Setup Guide

### Prerequisites

- Node.js ≥ 18
- npm, yarn, or pnpm
- A Google Cloud Project with Drive API enabled
- A Vercel account (for deployment)

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# Google Drive API — OAuth2 Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
GOOGLE_REFRESH_TOKEN="1//xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Drive Folder IDs (see setup steps below)
UPLOAD_FOLDER_ID="xxxxxxxxxxxxxxxxxxxxxxxxx"
REFERENCE_FOLDER_ID="xxxxxxxxxxxxxxxxxxxxxxxxx"

# Admin Dashboard Access
ADMIN_SECRET="your-strong-secret-here"
```

### Google Drive Setup Steps

1. **Create a Google Cloud Project**
   - Enable the Google Drive API
   - Create OAuth2 credentials (Desktop application type)
   - Add `https://developers.google.com/oauthplayground` as an authorized redirect URI

2. **Obtain a Refresh Token**
   - Visit the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
   - Select the Drive API scopes (`https://www.googleapis.com/auth/drive.file`)
   - Exchange your authorization code for a refresh token
   - Copy the refresh token into `GOOGLE_REFRESH_TOKEN`

3. **Create Two Drive Folders**
   - **Reference folder:** Set sharing to "Anyone with the link can view"
   - **Upload folder:** Keep private (only accessible via API)
   - Copy both folder IDs from the URL bar into `.env.local`

### Local Development

```bash
# Install dependencies
npm install

# Run the development server (Turbopack)
npm run dev

# Open in browser
open http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Admin Stats Endpoint

```bash
curl -H "x-admin-secret: your-secret" http://localhost:3000/api/admin/stats
```

---

## 🔐 Privacy & Ethics

وصال is designed with **privacy as a first principle**:

- **No PII is logged** — only the anonymized UUID (4-char alphanumeric) is stored in telemetry.
- **Contributor names are stored only in the filename** and in the local session store. They are never transmitted to the logging layer.
- **No analytics cookies**, no third-party trackers, no fingerprinting.
- **Video recordings are uploaded server-to-server** directly to Google Drive without any intermediate storage or processing.
- **The UUID is generated client-side** and can be reset by clearing `localStorage` at any time.

---

## 🤝 Contribution

We welcome contributions from researchers, developers, and sign language advocates.

### How to Contribute

1. **Fork** the repository
2. **Branch** from `main` (`git checkout -b feature/your-feature`)
3. **Think Before Coding** — review existing patterns, understand the architecture, and discuss your approach before writing code
4. **Commit** your changes with clear, descriptive messages
5. **Push** to your branch (`git push origin feature/your-feature`)
6. **Open a Pull Request** against the `main` branch

### Code Style Guidelines

- Follow the existing hook/component decomposition pattern
- Prefer local state over global stores
- Write Arabic-first UI with proper RTL support (`dir="rtl"`)
- Use the existing `logger` instance for observability
- Always run `npm run build` before submitting a PR

---

## 👥 Team & Credits

**Team وصال (Wesall)** is a group of researchers, engineers, and accessibility advocates committed to advancing Arabic Sign Language technology.

| Role | Contributor |
|------|-------------|
| **Project Lead & Architecture** | Abdulrahman M. Rezk |
| **AI & Pose Detection** | Abdulrahman M. Rezk |
| **UI/UX & Arabic Design** | Team Wesall |
| **Data Collection Coordination** | Dalia (Reference Video Lead) |

*Special thanks to the Deaf community across the Arab world for their inspiration and guidance.*

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>وصال</strong> — Connecting the Deaf community with technology, one sign at a time.
</p>
<p align="center">
  <a href="mailto:wesall.g.team@gmail.com">wesall.g.team@gmail.com</a>
</p>
