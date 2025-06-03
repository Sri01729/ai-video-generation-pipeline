# Feature Implementation Order – AI Video Generation Pipeline

## Features & Changes Implemented (as of 2024-06-10)

### 1. Monorepo & Tooling
- pnpm workspaces, Turborepo for caching/build orchestration
- Shared types and utility packages
- Prettier, ESLint, and pre-commit hooks for code quality

### 2. Frontend (Vite + React)
- **Vite** is used as the build tool (not Next.js)
- React 18, TailwindCSS, shadcn/ui for UI primitives
- Modern dashboard UI for video/job submission and status
- Pipeline steps visualization (progress, quality, time per step)
- Video preview panel
- Creative prompt animation
- No SSR/SSG; pure SPA with fast HMR

### 3. Backend (Node.js/Express)
- REST API for video/job management, health, and integration with Supabase, S3, Cognito
- BullMQ (Bull) for job queueing
- Bull Board for queue/job monitoring at `/admin/queues`
- Rate limiting, CORS, Helmet for security
- Logging with Winston

### 4. Worker Service
- Picks up jobs from Bull queue
- Runs the full video generation pipeline:
  - Script generation (OpenAI, Anthropic, Google, XAI)
  - Voice generation (VoCloner via Playwright automation)
  - Audio mixing (voice + BGM) with FFmpeg
  - Subtitle generation (AssemblyAI)
  - Script-to-image generation (OpenAI, Google, Anthropic, XAI)
  - Image-to-video assembly (FFmpeg)
  - Audio/video muxing
  - Subtitle burning (ASS/FFmpeg)
- OutputManager utility for organized run directories

### 5. Job Queue (Bull + Redis)
- Redis-backed Bull queue for all video jobs
- Jobs enqueued by backend, processed by worker
- Basic error handling, retries, and logging
- Bull Board for real-time queue/job monitoring

### 6. S3 Integration
- Signed upload/download URLs for video assets
- Worker uploads results to S3

### 7. Supabase Integration
- Used as the main Postgres DB
- RLS for per-user data isolation
- Tables: users, videos, jobs (with relationships)
- Supabase JS client for both backend and frontend

### 8. Auth (AWS Cognito)
- User registration, login, JWT issuance/validation
- Amplify not used; direct Cognito integration

### 9. Docker & DevOps
- Dockerfiles for backend, worker, frontend
- Docker Compose for local dev
- GitHub Actions for CI (lint, build, type-check)
- .env, .env.staging, .env.production for config

### 10. Output Management
- All pipeline outputs organized by run in `/results`
- Each run has subfolders for script, audio, images, video, subtitles

### 11. Miscellaneous
- TypeScript everywhere
- Modern, modular codebase
- Clear separation of concerns (frontend, backend, worker)
- CHANGELOG, CONTRIBUTING, and detailed README

---

### Notable Differences from Original Plan

- **Frontend is Vite+React, not Next.js** (no SSR/SSG, no API routes in frontend)
- Auth is handled directly with Cognito, not via Amplify
- Pipeline steps and job progress are visualized in the frontend, but currently use dummy data (real progress tracking is planned)
- BullMQ is used for job queueing, but advanced features (priorities, dependencies, dead-letter queues) are not fully implemented yet
- Worker pipeline is fully sequential, with each step as a modular function
- OutputManager ensures reproducible, organized results for every run

---

### Next Steps / TODOs

- Implement real progress tracking and job status updates in frontend
- Add job prioritization, concurrency control, and dead-letter queue handling in Bull
- Integrate real-time updates (WebSockets or Supabase subscriptions)
- Add more robust error handling and monitoring
- Expand test coverage (unit/E2E)
- Productionize Dockerfiles and deployment scripts

---

1. **Monorepo & Tooling Setup**
   - pnpm workspaces, Turborepo, linting, formatting, pre-commit hooks, shared types package.

2. **Database (Supabase) Schema & RLS**
   - Set up tables for users, videos, jobs. Enable RLS.

3. **Auth (AWS Cognito) Integration**
   - User registration, login, JWT issuance/validation.

4. **Backend API (Node.js/Express)**
   - Basic REST endpoints: health, auth, CRUD for videos/jobs. Integrate Supabase and Cognito.

5. **Frontend (Next.js) Skeleton**
   - Auth flows, dashboard, video/job submission UI.

6. **Job Queue (Bull + Redis)**
   - Enqueue jobs from backend, basic worker that picks up jobs.

7. **Worker Service (Skeleton)**
   - Picks up jobs, updates job status in DB.

8. **S3 Integration**
   - Backend endpoints for signed upload/download URLs. Worker uploads results to S3.

9. **AI Integrations (OpenAI, AssemblyAI, VoCloner, Voice.ai)**
   - Implement each step in the worker pipeline, one at a time.

10. **Video Assembly (ffmpeg)**
    - Combine audio, video, captions in worker.

11. **Frontend: Video Status & Playback**
    - Polling/subscription for job status, show video when ready.

12. **Testing & Monitoring**
    - Add unit/E2E tests, logging, error tracking.

13. **CI/CD, Docker, and Deployment**
    - Dockerize all services, set up GitHub Actions, deploy to cloud.

---

**Optional/After Core:**
- Real-time updates (WebSockets/Supabase subscriptions)
- User video management (delete, share, etc.)
- Admin dashboard, analytics, rate limiting, etc.

---

## Supabase Configuration & Usage

### Purpose
Supabase is used as the managed Postgres database and real-time backend for this project. It provides:
- A scalable, production-grade relational database (PostgreSQL)
- Instant REST and real-time APIs
- Row-Level Security (RLS) for fine-grained access control
- Easy integration with TypeScript/JS via `@supabase/supabase-js`

**Problems Solved:**
- Centralized, secure storage for users, videos, jobs, and related metadata
- Enforces per-user data access (multi-tenancy)
- Enables real-time updates and analytics
- Simplifies backend logic with built-in auth, RLS, and API generation

### Configuration Details
- **Environment Variables:**
  - `SUPABASE_URL`: Project API URL (from Supabase dashboard)
  - `SUPABASE_ANON_KEY`: Public (frontend) API key (read/write with RLS)
  - `SUPABASE_SERVICE_KEY`: Private (backend) API key (full access, keep secret)
- **Client Initialization:**
  - Frontend uses `@supabase/supabase-js` with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
  - Backend uses `@supabase/supabase-js` with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` for admin tasks
- **Secrets:**
  - Keys are stored in `.env`, `.env.staging`, `.env.production` (never committed)
  - Only the anon key is exposed to the frontend

### Database Structure & Table Relationships
- **users**: Stores user metadata (id = Cognito sub, email, name, is_admin)
- **videos**: Each video belongs to a user (`user_id` FK)
- **jobs**: Each job belongs to a user (`user_id` FK), and optionally a video (`video_id` FK)
- **Relationships:**
  - `users.id` → `videos.user_id` (1-to-many)
  - `users.id` → `jobs.user_id` (1-to-many)
  - `videos.id` → `jobs.video_id` (1-to-many, nullable)
- **Data Models:**
  - Users: Auth, ownership, admin roles
  - Videos: User-generated content, status, S3 URLs
  - Jobs: Processing pipeline, status, error/result payloads

### Best Practices
- **RLS Policies:**
  - Users can only access their own rows (by `auth.uid()`)
  - Admins can access all rows (checked via `is_admin`)
- **API Key Handling:**
  - Never expose service key to frontend
  - Rotate keys if leaked
- **Naming Conventions:**
  - Use `snake_case` for all table/column names
- **Indexing:**
  - Primary keys on all tables
  - Foreign key indexes for fast joins
  - Consider additional indexes on `status`, `created_at` for queries
- **Versioning:**
  - Use SQL migrations for schema changes
  - Document all migrations

### Real-World Use Cases
- **User-Generated Content:**
  - Each user can create, view, and manage their own videos and jobs
  - RLS ensures strict data isolation
- **Multi-Tenant Applications:**
  - Add `org_id` to tables for team/enterprise features
- **Analytics Pipelines:**
  - Use jobs table for tracking processing, failures, and performance
- **Scalability:**
  - PostgreSQL scales vertically and horizontally (read replicas, partitioning)
  - Supabase provides managed backups, monitoring, and scaling

### SQL Concepts Involved
- **Normalization:**
  - Separate tables for users, videos, jobs (3NF)
- **Constraints:**
  - Primary keys, foreign keys, unique constraints (email)
- **Indexing:**
  - PKs, FKs, and query-optimized indexes
- **Views/Functions:**
  - Can add Postgres views for analytics, or functions for custom logic
- **RLS:**
  - Fine-grained access control at the row level
- **Extensions:**
  - Supabase/Postgres supports extensions (e.g., `pgcrypto` for UUIDs)

Supabase leverages PostgreSQL's mature feature set, making it a strong choice for secure, scalable, and developer-friendly data management in modern SaaS and AI-driven applications.

---

## AWS Cognito User Pool & App Client Setup

### Concept & Purpose
AWS Cognito User Pools provide secure, scalable user authentication and management for web/mobile apps. They handle:
- User registration, login, password reset
- Social login (Google, Apple, etc.)
- Multi-factor authentication (MFA)
- JWT issuance for secure API access

**Why Cognito?**
- Offloads complex auth logic to a managed, secure AWS service
- Integrates with frontend (Amplify) and backend (JWT validation)
- Supports social logins and advanced auth features out of the box

### Step-by-Step: Creating a User Pool & App Client (AWS Console)
1. **Go to AWS Console → Cognito → User Pools → Create user pool**
2. **Name your pool** (e.g., `ai-video-users`)
3. **Configure sign-in options:**
   - Allow email (and optionally phone number) as sign-in
   - Enable social providers (Google, Apple, etc.) if desired (requires setting up OAuth credentials)
4. **Configure security:**
   - Set password policy (min length, special chars, etc.)
   - Enable MFA if needed
5. **Attributes:**
   - Select standard attributes (email, name, etc.)
   - Add custom attributes if needed (e.g., profile_picture)
6. **App integration:**
   - Create an App Client (e.g., `ai-video-web-client`)
   - *Do not* generate a client secret (for frontend use)
   - Enable "Authorization code grant" and "Implicit grant" for web apps
   - Set callback/logout URLs (e.g., `http://localhost:3000/` for dev)
7. **Review and create**
8. **Save your Pool ID and App Client ID** (you'll need these for frontend/backend config)

### Key Concepts
- **User Pool:** The database of users and auth settings
- **App Client:** Represents a frontend or backend app that connects to Cognito
- **JWT:** JSON Web Token issued by Cognito, used for secure API access
- **Social Login:** Cognito can federate with Google, Apple, etc. for seamless sign-in

### Best Practices
- Never expose App Client secrets in frontend code
- Use separate App Clients for frontend and backend if needed
- Store Pool ID and App Client ID in environment variables
- Use strong password/MFA policies for production

---

## Frontend Auth Integration: AWS Amplify + Cognito

### Concept & Purpose
AWS Amplify provides a high-level, secure, and developer-friendly way to integrate Cognito authentication into React/Next.js apps. It handles:
- User registration, login, logout
- Social logins (Google, Apple, etc.)
- Secure token storage and refresh
- UI components for rapid prototyping

**Why Amplify?**
- Abstracts away low-level Cognito API calls
- Handles edge cases (token expiry, refresh, etc.)
- Fastest way to get secure, production-ready auth flows

### Step-by-Step: Amplify Setup in Next.js
1. **Install dependencies:**
   ```sh
   pnpm add aws-amplify @aws-amplify/ui-react
   ```
2. **Configure Amplify:**
   - Create `src/amplify-config.ts` in your frontend app:
     ```ts
     import { Amplify } from 'aws-amplify';
     import awsconfig from './aws-exports';
     Amplify.configure(awsconfig);
     ```
   - Or, configure inline in `_app.tsx`:
     ```ts
     import { Amplify } from 'aws-amplify';
     Amplify.configure({
       Auth: {
         region: process.env.NEXT_PUBLIC_COGNITO_REGION,
         userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
         userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID,
         oauth: {
           domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
           scope: ['email', 'openid', 'profile'],
           redirectSignIn: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN,
           redirectSignOut: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT,
           responseType: 'code',
         },
       },
     });
     ```
   - Store all secrets in `.env.local` (never commit):
     ```env
     NEXT_PUBLIC_COGNITO_REGION=us-east-1
     NEXT_PUBLIC_COGNITO_USER_POOL_ID=...
     NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=...
     NEXT_PUBLIC_COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
     NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN=http://localhost:3000/
     NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT=http://localhost:3000/
     ```
3. **Add Amplify Auth UI:**
   - In your main page or a dedicated auth page:
     ```tsx
     import { withAuthenticator } from '@aws-amplify/ui-react';
     function MyApp({ signOut, user }) {
       return (
         <div>
           <h1>Welcome, {user?.username}</h1>
           <button onClick={signOut}>Sign out</button>
         </div>
       );
     }
     export default withAuthenticator(MyApp);
     ```
   - This provides a full-featured, customizable auth UI out of the box.

### Key Concepts
- **Amplify UI:** Prebuilt, accessible React components for auth
- **withAuthenticator:** HOC that wraps your app/page with login/signup flows
- **Environment Variables:** All sensitive config is loaded from `.env.local`

### Best Practices
- Never commit `.env.local` or secrets
- Use Amplify's default UI for fast prototyping, then customize as needed
- Always use HTTPS in production for OAuth redirects
- Test social logins in Cognito console before enabling in prod

---

## Troubleshooting: Amplify + Next.js Auth Integration

### 1. Style Import Error
**Error:**
```
Module not found: Can't resolve '@aws-amplify/ui-react/styles.css' or '@aws-amplify/ui-react/dist/styles.css'
```
**Fix:**
- Ensure you have the latest `@aws-amplify/ui-react` installed:
  ```sh
  pnpm add @aws-amplify/ui-react@latest
  ```
- Use the correct import:
  ```js
  import '@aws-amplify/ui-react/styles.css';
  ```
- If you still get an error, check your `node_modules/@aws-amplify/ui-react/` for the actual CSS file path.

### 2. SSR/Client-Side Error
**Error:**
```
TypeError: Cannot read properties of undefined (reading 'loginWith')
```
**Cause:**
- `Amplify.configure` was being run on the server (SSR) in Next.js app directory.

**Fix:**
- Only run `Amplify.configure` on the client side, e.g. in a `useEffect` in a `'use client'` component.
- Do not import and run Amplify config at the module level in the app directory.

### 3. TypeScript Lint Error
**Error:**
```
Object literal may only specify known properties, and 'region' does not exist in type 'AuthConfig'.
```
**Fix:**
- Cast the config object as `any`:
  ```js
  Amplify.configure({ ... } as any);
  ```
- This is safe for runtime and silences the type error.

---

**Summary:**
- Always use the correct style import for your Amplify UI version.
- Only configure Amplify on the client side in Next.js app directory.
- Use `as any` to silence TypeScript config errors if needed.

These steps ensure smooth integration of Amplify Auth in a Next.js (app directory) project.

---

## OpenAI Script Generation in Worker (Pipeline Step 1)

### Purpose
Automate the creation of video scripts using OpenAI, as the first step in the AI video generation pipeline. Example: Generate a 60-second script in the style of Thanos explaining JavaScript.

### Implementation Steps
1. **Install OpenAI SDK**
   - In `apps/worker`: `pnpm add openai`
2. **Create Utility**
   - File: `src/utils/openaiScriptGenerator.ts`
   - Exports `generateVideoScript(prompt: string): Promise<string>`
   - Uses a hard-core system prompt for Thanos persona
   - Example model: `'gpt-4o-mini'`
3. **API Key Handling**
   - Pass API key directly in code (for test/dev only; use env var in prod):
     ```ts
     const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
     // or for quick test: { apiKey: 'sk-...' }
     ```
   - Make sure `dotenv` loads before any OpenAI usage
4. **Test Usage**
   - Wrap test call in async IIFE to avoid top-level await error:
     ```ts
     (async () => {
       const script = await generateVideoScript(
         "Explain what JavaScript is, how it works, and why it is important, as Thanos would, in a 60-second video."
       );
       console.log(script);
     })();
     ```
   - Run with `pnpm dev` in `apps/worker` and check console output

### Gotchas
- **Top-level await**: Not allowed unless using ESM. Always use an async IIFE for test calls.
- **API Key**: If missing, OpenAI SDK will throw. Ensure dotenv loads first, or hardcode for quick tests.
- **Persona Prompting**: Use a strong system prompt to get the desired style (e.g., Thanos, 60s, intimidating, etc.)

### Example System Prompt
```
You are Thanos, the Mad Titan from the Marvel universe. You speak with gravitas, confidence, and a sense of inevitable destiny. You are explaining JavaScript to an audience as if you are delivering a monologue about the fate of the universe. Your tone is philosophical, intimidating, and slightly condescending. The script should be for a 60-second video, concise but powerful, and must sound unmistakably like Thanos.
```

### Example User Prompt
```
Explain what JavaScript is, how it works, and why it is important, as Thanos would, in a 60-second video.
```

---

## VoCloner TTS Automation with Playwright (Worker Pipeline Step 2)

### What We Built
- Automated Google login and TTS synthesis on vocloner.com using Playwright + playwright-extra + puppeteer-extra-plugin-stealth.
- Script:
  - Navigates to login page
  - Clicks Google login button (XPath)
  - (Manual login or automated if possible)
  - Clicks Thanos voice element (XPath)
  - Fills TTS text field with a Thanos-style script
  - Clicks TTS submit button
  - Waits for synthesis
  - Clicks download button and saves the audio file automatically with a dynamic filename using Playwright's download API (no OS dialog)

### Bugs/Issues Faced
- **Google login automation blocked:**
  - Google detects automation and blocks login as "browser/app not secure".
  - Playwright's default browsers are fingerprinted as bots.
- **Stealth plugin confusion:**
  - Wrong package (`@secret-agent/extra-plugin-stealth`) does not work; must use `puppeteer-extra-plugin-stealth` with `playwright-extra`.
- **TypeScript errors:**
  - No types for stealth plugin; fixed by adding a custom module declaration and updating `typeRoots` in `tsconfig.json`.
- **Session persistence:**
  - Needed to use `launchPersistentContext` to keep login session and avoid repeated manual logins.
- **XPath selectors:**
  - Required precise XPath for Google login, TTS field, submit, and download buttons.
- **Manual login fallback:**
  - Sometimes had to log in manually and let automation continue after login.

### What Made It Work
- Used `playwright-extra` with `puppeteer-extra-plugin-stealth` for best anti-bot evasion.
- Disabled specific stealth evasions (`iframe.contentWindow`, `media.codecs`) for compatibility.
- Used persistent user data directory to keep session/cookies.
- Waited for selectors and used explicit timeouts for reliability.
- Manual login as fallback when Google blocks automation.

### Example Automation Flow
```ts
await page.goto('https://vocloner.com/login.php');
await page.click('xpath=/html/body/section/div/div/div/div[1]/div/div/a');
// ...Google login steps (manual or automated)...
await page.click('xpath=/html/body/section/div/div[2]');
await page.fill('xpath=//*[@id="text"]', 'Thanos-style script...');
await page.click('xpath=//*[@id="ttsForm"]/button');
await page.waitForTimeout(60000); // Wait for TTS
await page.click('xpath=//*[@id="downloadBtn"]');
```

### Download Handling
- Used Playwright's download API (`waitForEvent('download')` and `saveAs`) to programmatically save the audio file to a specified path, avoiding OS dialogs.
- Filenames are generated dynamically using a timestamp, e.g. `thanos-1717968765123.mp3`.

## Step 3: Mix Voice-Over and Background Music

After generating the voice-over audio and selecting a background music (BGM) track, the worker service mixes these two audio sources into a single, volume-balanced file. This is done using `fluent-ffmpeg` and `ffmpeg-static`.

### Process
1. **Inputs:**
   - Voice-over audio file (e.g., `thanos-explaining-javascript.mp3`)
   - Background music file (e.g., `ai-video-bgm.mp3`)
2. **Mixing Logic:**
   - The BGM is volume-attenuated (e.g., -15dB or lower) so it does not overpower the voice.
   - Both tracks are combined using FFmpeg's `amix` filter.
3. **Output:**
   - A single mixed audio file (e.g., `final-mixed.mp3`) is produced for use in the next pipeline step.

### Example Code
```ts
import { mixAudio } from './utils/mixAudio';

await mixAudio({
  voicePath: 'path/to/voice.mp3',
  musicPath: 'path/to/bgm.mp3',
  outputPath: 'path/to/mixed.mp3',
  musicVolumeDb: -15, // Lower for quieter BGM
});
```

- File paths must be correct relative to the script's working directory or use absolute paths.
- The output is used in the subsequent video assembly step.

## Step 4: Attach Mixed Audio to Background Video

After mixing the voice-over and background music, the next step is to combine this audio with a background video. The worker service uses `fluent-ffmpeg` and `ffmpeg-static` to attach the audio to the video, trimming or looping the video as needed to match the audio duration.

### Process
1. **Inputs:**
   - Background video file (e.g., `Background-video.mp4`)
   - Mixed audio file (e.g., `final-mixed.mp3`)
2. **Attachment Logic:**
   - The video is trimmed to match the audio duration (using `-shortest` in ffmpeg).
   - The original video audio (if any) is replaced by the mixed audio.
3. **Output:**
   - A single `.mp4` video file (e.g., `final-video.mp4`) with the new audio track.

### Example Code
```ts
import { attachAudioToVideo } from './utils/attachAudioToVideo';

await attachAudioToVideo({
  videoPath: 'path/to/background.mp4',
  audioPath: 'path/to/final-mixed.mp3',
  outputPath: 'path/to/final-video.mp4',
});
```

- The video will be trimmed if it is longer than the audio.
- If you need to loop the video to match a longer audio, additional ffmpeg logic is required.
- File paths must be correct relative to the script's working directory or use absolute paths.

---

## Step 5: Transcribe Audio and Generate SRT Subtitles (AssemblyAI)

After producing the final mixed audio, the next step is to generate subtitles. The worker service uses AssemblyAI to transcribe the audio and outputs an SRT subtitle file for use in the video pipeline.

### Process
1. **Inputs:**
   - Mixed audio file (e.g., `final-mixed.mp3`)
2. **Transcription Logic:**
   - The audio is uploaded to AssemblyAI via their Node SDK.
   - The service transcribes the audio with word-level timestamps.
   - The transcript is converted to SRT format, grouping words by sentence or every ~7 words.
3. **Output:**
   - An SRT subtitle file (e.g., `final-mixed.srt`) is produced for use in the next pipeline step.

### Example Code
```ts
import 'dotenv/config';
import { transcribeAndGenerateSrt } from './utils/generateSrtFromAudio';

await transcribeAndGenerateSrt(
  'public/audiofiles/final-mixed.mp3',
  'public/subtitles/final-mixed.srt'
);
```

- Requires a valid `ASSEMBLYAI_API_KEY` in your `.env` file.
- The script will poll until the transcript is ready, then write the SRT file.
- SRT output is used in the next step to burn subtitles into the video.

---

## Step 6: Burn Styled ASS Subtitles into Video

After generating an ASS subtitle file with custom style (centered, big, purple font), the final step is to hardcode these subtitles into the video using ffmpeg.

### Process
1. **Inputs:**
   - Video file (e.g., `final-video.mp4`)
   - ASS subtitle file (e.g., `final-mixed.ass`)
2. **Burning Logic:**
   - ffmpeg is used with the `-vf ass=...` filter to overlay the styled subtitles onto the video.
   - The ASS style can be customized for font, size, color, and alignment. For purple, use `PrimaryColour: &H00800080`.
3. **Output:**
   - A new video file (e.g., `final-video-with-subs.mp4`) with hardcoded, styled subtitles.

### Example Code
```ts
import { burnSubtitles } from './utils/burnSubtitles';

await burnSubtitles({
  videoPath: 'public/videos/final-video.mp4',
  assPath: 'public/subtitles/final-mixed.ass',
  outputPath: 'public/videos/final-video-with-subs.mp4',
});
```

- The ASS style line for purple, big, centered subtitles:
  ```ass
  Style: Default,Arial,60,&H00800080,&H000000FF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,3,0,2,30,30,30,1
  ```
- Change the `Alignment` value for different vertical positions (2=bottom, 5=center, 8=top).
- The output video will have the subtitles burned in with the specified style.

---

## Pipeline Orchestration: aiVideoPipeline

To automate the entire AI video generation process, we created a single orchestrator function called `aiVideoPipeline`. This function sequentially combines all the core steps:

1. **Script Generation** (OpenAI):
   - Generates a video script from a user prompt.
2. **Voice Generation** (VoCloner):
   - Automates TTS voice creation using the generated script.
3. **Audio Mixing** (ffmpeg):
   - Mixes the generated voice with background music, volume-balanced.
4. **Attach Audio to Video** (ffmpeg):
   - Loops/trims the background video to match audio duration and attaches the mixed audio.
5. **Subtitle Generation** (AssemblyAI + ASS):
   - Transcribes the final audio, generates animated ASS subtitles with custom style/animation.
6. **Burn Subtitles** (ffmpeg):
   - Hardcodes the styled subtitles into the final video.

### Concept & Rationale
- **Sequential Design:**
  - Each step depends on the output of the previous step (e.g., you can't mix audio until you have both voice and BGM).
  - The pipeline uses `await` and explicit file existence checks to ensure that no step runs unless the previous one succeeded.
- **Error Handling:**
  - If any step fails (e.g., file not created, ffmpeg error), the pipeline halts and logs the error, preventing wasted compute and debugging headaches.
- **Extensibility:**
  - Each step is a standalone utility, making it easy to swap out, test, or parallelize for batch jobs in the future.
- **Robustness:**
  - The pipeline creates all necessary directories, checks for file outputs, and provides clear logs for each stage.

### Example Usage
```ts
await aiVideoPipeline({
  prompt: 'Explain JavaScript as Thanos in 60 seconds.',
  bgmPath: 'public/ai-video-bgm.mp3',
  videoPath: 'public/videos/background.mp4',
  outputDir: 'public/finalOutput',
});
```

### Why This Approach?
- **Maintainability:** Each function is focused and testable.
- **Reliability:** Sequential, fail-fast design ensures no silent errors or missing outputs.
- **Clarity:** The pipeline is easy to read, debug, and extend for new features (e.g., watermarking, analytics, etc).

---

## Output Directory Setup (OutputManager)

### Purpose
To ensure all pipeline outputs are organized, reproducible, and easy to locate, we implemented a dedicated output directory structure managed by an `OutputManager` utility.

### Implementation Details
- **Config File:**
  - `output.config.ts` at the project root defines the base output directory and subfolders.
  - Example:
    ```ts
    export const outputConfig = {
      baseDir: 'ai-video-generation-pipeline/results',
      subfolders: ['script', 'audio', 'images', 'video', 'subtitles'],
    };
    ```
- **OutputManager Utility:**
  - Reads config and creates a new run folder for each pipeline execution.
  - Run folder is named using a sanitized keyword from the prompt and a timestamp (e.g., `explain_ai_May24_10-35am`).
  - Subfolders for each pipeline step are created inside the run folder.
  - If the run folder already exists, creation is skipped and a log is printed.
  - All results are now always inside `ai-video-generation-pipeline/results/`.

### Example Usage
```ts
import { OutputManager } from './utils/outputManager';
const om = new OutputManager();
const runDir = om.setupRunDirs(prompt);
```

### Benefits
- Keeps all outputs for each run grouped and easy to find
- Prevents accidental overwrites
- Configurable and extensible for future needs
- Ensures reproducibility and clarity in the pipeline