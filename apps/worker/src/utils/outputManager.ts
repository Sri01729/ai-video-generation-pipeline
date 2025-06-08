import fs from 'fs';
import path from 'path';
import { outputConfig } from '../../../../output.config';

function sanitize(str: string) {
  return str.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function extractKeyword(prompt: string | undefined | null): string {
  if (!prompt || typeof prompt !== 'string') return 'run';
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'is', 'are', 'as', 'by', 'at', 'from']);
  const words = prompt.split(/\s+/).map(w => w.toLowerCase()).filter(w => w && !stopwords.has(w));
  const unique = Array.from(new Set(words));
  return sanitize(unique.slice(0, 2).join('_')) || 'run';
}

function getDateTimeString() {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'short' });
  const day = now.getDate();
  let hour = now.getHours();
  const min = now.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  return `${month}${day}_${hour}-${min}${ampm}`;
}

export class OutputManager {
  baseDir: string;
  subfolders: string[];

  constructor() {
    this.baseDir = outputConfig.baseDir;
    this.subfolders = outputConfig.subfolders;
  }

  setupRunDirs(prompt: string) {
    const keyword = extractKeyword(prompt);
    const dateTime = getDateTimeString();
    const runDir = path.join(this.baseDir, `${keyword}_${dateTime}`);
    if (fs.existsSync(runDir)) {
      console.log(`[SKIP] Run folder exists: ${runDir}`);
      return runDir;
    }
    fs.mkdirSync(runDir, { recursive: true });
    this.subfolders.forEach(sub => {
      fs.mkdirSync(path.join(runDir, sub), { recursive: true });
    });
    console.log(`[OK] Created run folder: ${runDir}`);
    this.subfolders.forEach(sub => {
      console.log(`  └─ ${sub}/`);
    });
    return runDir;
  }
}

// if (require.main === module) {
//   const prompt = 'Explain AI video generation pipeline with memes';
//   const om = new OutputManager();
//   const runDir = om.setupRunDirs(prompt);
//   console.log('Test complete. Run directory:', runDir);
// }

// Example config file (output.config.ts):
// export const outputConfig = {
//   baseDir: 'results',
//   subfolders: ['script', 'audio', 'images', 'video', 'subtitles'],
// };