# AI Video Generation Pipeline - Full Stack Implementation Guide

This guide provides detailed instructions for building a full-stack AI video generation pipeline with NextJS frontend, Node.js backend, Supabase database, AWS Cognito authentication, S3 storage, and AssemblyAI for audio-to-text conversion.

## System Architecture Overview

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│  NextJS       │────▶│  Node.js      │────▶│  Supabase     │
│  Frontend     │◀────│  Backend      │◀────│  Database     │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│  AWS Cognito  │     │  AWS S3       │     │  External     │
│  Auth         │     │  Storage      │     │  Services     │
│               │     │               │     │  - OpenAI     │
└───────────────┘     └───────────────┘     │  - VoCloner   │
                                           │  - Voice.ai   │
                                           │  - AssemblyAI │
                                           └───────────────┘
```

## 1. Project Setup

### 1.1 Initialize Project Structure

```bash
# Create root directory
mkdir ai-video-pipeline
cd ai-video-pipeline

# Initialize monorepo with workspaces
npm init -y
```

Edit the package.json to set up workspaces:

```json
{
  "name": "ai-video-pipeline",
  "version": "1.0.0",
  "workspaces": [
    "frontend",
    "backend"
  ],
  "private": true
}
```

### 1.2 Create Frontend with Next.js

```bash
# Create Next.js frontend
npx create-next-app@latest frontend
cd frontend
npm install aws-amplify @aws-sdk/client-cognito-identity @aws-sdk/client-s3 @supabase/supabase-js axios swr react-hook-form
```

### 1.3 Create Backend with Node.js

```bash
# Create backend directory
mkdir backend
cd backend

# Initialize backend
npm init -y

# Install dependencies
npm install express cors helmet dotenv aws-sdk @aws-sdk/client-cognito-identity-provider @aws-sdk/client-s3 @supabase/supabase-js axios puppeteer puppeteer-extra puppeteer-extra-plugin-stealth uuid bull fluent-ffmpeg assemblyai openai multer express-validator jsonwebtoken winston
npm install --save-dev nodemon typescript ts-node @types/node @types/express @types/cors
```

Initialize TypeScript for the backend:

```bash
npx tsc --init
```

## 2. AWS Setup

### 2.1 Create Cognito User Pool

1. Navigate to AWS Console > Cognito > User Pools
2. Click "Create user pool"
3. Configure authentication settings:
   - Select "Email" as sign-in option
   - Select required attributes (email, name)
   - Set password policy (min 8 chars, require numbers, special chars, etc.)
4. Configure app clients:
   - Create app client for your application
   - Note the User Pool ID and App Client ID

### 2.2 Create S3 Bucket

1. Navigate to AWS Console > S3
2. Create a new bucket for media storage
   - Name: `ai-video-pipeline-media`
   - Region: Choose appropriate region
   - Block all public access: Uncheck if you need public URLs
3. Enable CORS for frontend access:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 2.3 Create IAM Role for Backend

1. Navigate to AWS Console > IAM > Roles
2. Create a new role with:
   - Permissions for S3 actions
   - Permissions for Cognito actions

## 3. Supabase Setup

### 3.1 Create Supabase Project

1. Sign up/in to Supabase
2. Create a new project
3. Note down the Supabase URL and anon key

### 3.2 Create Database Schema

Run the following SQL in the Supabase SQL editor:

```sql
-- Users table (extended info beyond Cognito)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  video_url TEXT,
  thumbnail_url TEXT
);

-- Video Processing Jobs
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) NOT NULL,
  step TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  input JSON,
  output JSON,
  error TEXT
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Video policies
CREATE POLICY "Users can CRUD own videos" ON videos
  FOR ALL USING (auth.uid() = user_id);

-- Job policies
CREATE POLICY "Users can view own jobs" ON processing_jobs
  USING (EXISTS (
    SELECT 1 FROM videos
    WHERE videos.id = processing_jobs.video_id
    AND videos.user_id = auth.uid()
  ));
```

## 4. Backend Implementation

### 4.1 Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── aws.ts
│   │   ├── supabase.ts
│   │   ├── environment.ts
│   │   └── queues.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── video.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── audio.service.ts
│   │   ├── storage.service.ts
│   │   └── video.service.ts
│   ├── queues/
│   │   ├── queue.ts
│   │   └── processors/
│   │       ├── text-generation.processor.ts
│   │       ├── audio-generation.processor.ts
│   │       ├── audio-enhancement.processor.ts
│   │       └── video-creation.processor.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── helpers.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── video.routes.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts
├── .env
├── package.json
└── tsconfig.json
```

### 4.2 Environment Configuration

Create a `.env` file:

```
# Server
PORT=4000
NODE_ENV=development

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_COGNITO_USER_POOL_ID=your_user_pool_id
AWS_COGNITO_CLIENT_ID=your_client_id
AWS_S3_BUCKET=ai-video-pipeline-media

# Supabase
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# External APIs
OPENAI_API_KEY=your_openai_key
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Redis (for Bull queue)
REDIS_URL=redis://localhost:6379
```

### 4.3 Core Configuration Files

#### src/config/environment.ts
```typescript
export const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    cognitoClientId: process.env.AWS_COGNITO_CLIENT_ID,
    s3Bucket: process.env.AWS_S3_BUCKET
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  assemblyai: {
    apiKey: process.env.ASSEMBLYAI_API_KEY
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
};
```

#### src/config/aws.ts
```typescript
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client } from '@aws-sdk/client-s3';
import { env } from './environment';

// Create AWS Cognito client
export const cognitoClient = new CognitoIdentityProviderClient({
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKeyId!,
    secretAccessKey: env.aws.secretAccessKey!
  }
});

// Create AWS S3 client
export const s3Client = new S3Client({
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKeyId!,
    secretAccessKey: env.aws.secretAccessKey!
  }
});

export const s3BucketName = env.aws.s3Bucket!;
```

#### src/config/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js';
import { env } from './environment';

if (!env.supabase.url || !env.supabase.key) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(env.supabase.url, env.supabase.key);
```

### 4.4 Queue Setup

#### src/config/queues.ts
```typescript
import Bull from 'bull';
import { env } from './environment';

export const videoProcessingQueue = new Bull('video-processing', {
  redis: env.redis.url,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: false,
    removeOnFail: false
  }
});

export const queues = {
  videoProcessing: videoProcessingQueue
};
```

### 4.5 Core Services

#### src/services/ai.service.ts
```typescript
import { Configuration, OpenAIApi } from 'openai';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

const configuration = new Configuration({
  apiKey: env.openai.apiKey,
});

const openai = new OpenAIApi(configuration);

export class AIService {
  async generateScriptContent(prompt: string): Promise<string> {
    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Create a video script about: ${prompt}`,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.data.choices[0].text?.trim() || '';
    } catch (error) {
      logger.error('Error generating script content:', error);
      throw new Error('Failed to generate script content');
    }
  }
}

export const aiService = new AIService();
```

#### src/services/audio.service.ts
```typescript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';
import * as AssemblyAI from 'assemblyai';
import { logger } from '../utils/logger';
import { env } from '../config/environment';

puppeteer.use(StealthPlugin());

// Initialize AssemblyAI
const assemblyai = new AssemblyAI.Client(env.assemblyai.apiKey!);

export class AudioService {
  async generateVoiceFromText(text: string, outputPath: string): Promise<string> {
    logger.info('Starting voice generation');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Navigate to VoCloner
      await page.goto('https://vocloner.com', { waitUntil: 'networkidle2' });
      
      // Interact with the site - this will depend on the actual site structure
      // Example:
      await page.type('#text-input-field', text);
      await page.click('#generate-button');
      await page.waitForSelector('#download-button', { visible: true, timeout: 60000 });
      
      // Setup download
      const downloadPath = path.resolve(outputPath);
      await fs.mkdir(path.dirname(downloadPath), { recursive: true });
      
      // Set download behavior
      const cdp = await page.target().createCDPSession();
      await cdp.send('Browser.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.dirname(downloadPath),
      });
      
      // Click download
      await page.click('#download-button');
      
      // Wait for download - this is a simplified approach
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      logger.info('Voice generation completed');
      return outputPath;
    } catch (error) {
      logger.error('Error generating voice:', error);
      throw new Error('Failed to generate voice from text');
    } finally {
      await browser.close();
    }
  }

  async enhanceAudio(inputPath: string, outputPath: string): Promise<string> {
    logger.info('Starting audio enhancement');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Navigate to Voice.ai
      await page.goto('https://voice.ai', { waitUntil: 'networkidle2' });
      
      // Implement interaction with voice.ai
      // This will be similar to VoCloner implementation but adapted to voice.ai's interface
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      logger.info('Audio enhancement completed');
      return outputPath;
    } catch (error) {
      logger.error('Error enhancing audio:', error);
      throw new Error('Failed to enhance audio');
    } finally {
      await browser.close();
    }
  }

  async generateCaptions(audioFilePath: string): Promise<{ text: string, words: Array<{ text: string, start: number, end: number }> }> {
    try {
      logger.info('Generating captions using AssemblyAI');
      
      // Read the audio file
      const audioFile = await fs.readFile(audioFilePath);
      
      // Upload the audio file to AssemblyAI
      const uploadResponse = await assemblyai.transcripts.transcribe({
        audio: audioFile,
        auto_highlights: true,
        word_boost: ["AI", "video", "generation"],
        speaker_labels: true,
        punctuate: true,
        format_text: true,
        dual_channel: false,
        word_timestamps: true
      });

      // Return the transcript and word-level timestamps
      return {
        text: uploadResponse.text || '',
        words: uploadResponse.words || []
      };
    } catch (error) {
      logger.error('Error generating captions:', error);
      throw new Error('Failed to generate captions');
    }
  }
}

export const audioService = new AudioService();
```

#### src/services/storage.service.ts
```typescript
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, s3BucketName } from '../config/aws';
import { logger } from '../utils/logger';
import fs from 'fs/promises';

export class StorageService {
  async uploadFile(filePath: string, key: string, contentType: string): Promise<string> {
    try {
      const fileContent = await fs.readFile(filePath);
      
      const command = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType
      });
      
      await s3Client.send(command);
      
      // Generate a pre-signed URL for the uploaded file
      const getCommand = new GetObjectCommand({
        Bucket: s3BucketName,
        Key: key,
      });
      
      const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
      return url;
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: s3BucketName,
        Key: key,
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: s3BucketName,
        Key: key,
      });
      
      await s3Client.send(command);
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file from storage');
    }
  }
}

export const storageService = new StorageService();
```

#### src/services/video.service.ts
```typescript
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { storageService } from './storage.service';
import { supabase } from '../config/supabase';

export class VideoService {
  async createVideo(audioPath: string, backgroundVideoPath: string, captionsData: any, outputPath: string): Promise<string> {
    try {
      logger.info('Starting video creation');
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Generate subtitles file (SRT format)
      const subtitlesPath = path.join(path.dirname(outputPath), 'subtitles.srt');
      await this.generateSubtitlesFile(captionsData, subtitlesPath);
      
      // Create video with ffmpeg
      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(backgroundVideoPath)
          .input(audioPath)
          // Remove original audio
          .outputOptions(['-map 0:v', '-map 1:a', '-c:v copy', '-shortest'])
          // Add subtitles
          .videoFilters(`subtitles=${subtitlesPath}:force_style='FontSize=24,Alignment=10'`)
          .output(outputPath)
          .on('end', () => {
            logger.info('Video creation completed');
            resolve(outputPath);
          })
          .on('error', (err) => {
            logger.error('Error creating video:', err);
            reject(new Error('Failed to create video'));
          })
          .run();
      });
    } catch (error) {
      logger.error('Error in video creation process:', error);
      throw new Error('Failed to create video');
    }
  }

  private async generateSubtitlesFile(captionsData: any, outputPath: string): Promise<void> {
    try {
      let srtContent = '';
      let index = 1;
      
      // Process words into subtitles (simplified approach)
      const words = captionsData.words || [];
      const chunkSize = 5; // Words per subtitle
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;
        
        const startTime = this.formatSrtTime(chunk[0].start);
        const endTime = this.formatSrtTime(chunk[chunk.length - 1].end);
        const text = chunk.map(w => w.text).join(' ');
        
        srtContent += `${index}\n${startTime} --> ${endTime}\n${text}\n\n`;
        index++;
      }
      
      await fs.writeFile(outputPath, srtContent);
    } catch (error) {
      logger.error('Error generating subtitles file:', error);
      throw new Error('Failed to generate subtitles');
    }
  }

  private formatSrtTime(milliseconds: number): string {
    const date = new Date(milliseconds);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    
    return `${hours}:${minutes}:${seconds},${ms}`;
  }

  async saveVideoMetadata(userId: string, videoUrl: string, title: string, description: string): Promise<string> {
    try {
      const videoId = uuidv4();
      
      const { error } = await supabase
        .from('videos')
        .insert({
          id: videoId,
          user_id: userId,
          title,
          description,
          status: 'completed',
          video_url: videoUrl
        });
      
      if (error) {
        throw error;
      }
      
      return videoId;
    } catch (error) {
      logger.error('Error saving video metadata:', error);
      throw new Error('Failed to save video metadata');
    }
  }
}

export const videoService = new VideoService();
```

### 4.6 Queue Processors

#### src/queues/queue.ts
```typescript
import { videoProcessingQueue } from '../config/queues';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';
import { aiService } from '../services/ai.service';
import { audioService } from '../services/audio.service';
import { videoService } from '../services/video.service';
import { storageService } from '../services/storage.service';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

interface VideoJobData {
  videoId: string;
  userId: string;
  prompt: string;
  title: string;
  description: string;
  backgroundVideoKey?: string;
}

export const initializeQueues = () => {
  videoProcessingQueue.process(async (job) => {
    const { videoId, userId, prompt, title, description, backgroundVideoKey } = job.data as VideoJobData;
    logger.info(`Processing video job ${job.id} for video ${videoId}`);
    
    const tempDir = path.join(os.tmpdir(), 'ai-video-pipeline', videoId);
    await fs.mkdir(tempDir, { recursive: true });
    
    try {
      // Update status
      await updateJobStatus(videoId, 'text-generation', 'processing');
      
      // Step 1: Generate script content
      const scriptContent = await aiService.generateScriptContent(prompt);
      await updateJobStatus(videoId, 'text-generation', 'completed', { scriptContent });
      
      // Step 2: Generate voice audio
      await updateJobStatus(videoId, 'audio-generation', 'processing');
      const audioOutputPath = path.join(tempDir, 'audio.mp3');
      await audioService.generateVoiceFromText(scriptContent, audioOutputPath);
      await updateJobStatus(videoId, 'audio-generation', 'completed');
      
      // Step 3: Enhance audio
      await updateJobStatus(videoId, 'audio-enhancement', 'processing');
      const enhancedAudioPath = path.join(tempDir, 'enhanced-audio.mp3');
      await audioService.enhanceAudio(audioOutputPath, enhancedAudioPath);
      await updateJobStatus(videoId, 'audio-enhancement', 'completed');
      
      // Step 4: Generate captions
      await updateJobStatus(videoId, 'caption-generation', 'processing');
      const captionsData = await audioService.generateCaptions(enhancedAudioPath);
      await updateJobStatus(videoId, 'caption-generation', 'completed', { captionsData });
      
      // Step 5: Get background video (assuming it's already in S3)
      await updateJobStatus(videoId, 'video-creation', 'processing');
      const backgroundVideoPath = path.join(tempDir, 'background.mp4');
      
      // If no background provided, use a default one (implementation omitted)
      let bgVideoKey = backgroundVideoKey;
      if (!bgVideoKey) {
        // Use default background video (would be implemented in a real app)
        bgVideoKey = 'defaults/background.mp4';
      }
      
      // Download background video from S3
      const bgUrl = await storageService.getSignedDownloadUrl(bgVideoKey);
      // Download logic omitted for brevity - would fetch from URL to backgroundVideoPath
      
      // Step 6: Create final video
      const videoOutputPath = path.join(tempDir, 'final-video.mp4');
      await videoService.createVideo(enhancedAudioPath, backgroundVideoPath, captionsData, videoOutputPath);
      
      // Step 7: Upload to S3
      const videoKey = `videos/${userId}/${videoId}.mp4`;
      const videoUrl = await storageService.uploadFile(videoOutputPath, videoKey, 'video/mp4');
      
      // Step 8: Update database
      await videoService.saveVideoMetadata(userId, videoUrl, title, description);
      await updateJobStatus(videoId, 'video-creation', 'completed', { videoUrl });
      
      // Update overall video status
      await supabase
        .from('videos')
        .update({ status: 'completed', video_url: videoUrl })
        .eq('id', videoId);
      
      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });
      
      return { videoId, videoUrl };
    } catch (error) {
      logger.error(`Error processing video job ${job.id}:`, error);
      
      // Update job status to failed
      await supabase
        .from('videos')
        .update({ status: 'failed' })
        .eq('id', videoId);
      
      // Clean up temp files
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.error('Error cleaning up temp files:', cleanupError);
      }
      
      throw error;
    }
  });
  
  videoProcessingQueue.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });
  
  videoProcessingQueue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} failed:`, error);
  });
};

async function updateJobStatus(videoId: string, step: string, status: string, data?: any) {
  try {
    const { error } = await supabase
      .from('processing_jobs')
      .insert({
        video_id: videoId,
        step,
        status,
        output: data
      });
    
    if (error) {
      logger.error(`Error updating job status for