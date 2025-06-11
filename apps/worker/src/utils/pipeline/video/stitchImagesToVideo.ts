import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function parseAssDialogueTimings(assPath: string): { start: number, end: number }[] {
  const ass = fs.readFileSync(assPath, 'utf8');
  const lines = ass.split(/\r?\n/);
  const timings: { start: number, end: number }[] = [];
  for (const line of lines) {
    if (line.startsWith('Dialogue:')) {
      // Format: Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,Text
      const parts = line.split(',');
      if (parts.length > 3) {
        const start = assTimeToSeconds(parts[1]);
        const end = assTimeToSeconds(parts[2]);
        timings.push({ start, end });
      }
    }
  }
  return timings;
}

function assTimeToSeconds(assTime: string): number {
  // Format: H:MM:SS.CS (centiseconds)
  const [h, m, s] = assTime.split(':');
  const [sec, cs] = s.split('.');
  return (
    parseInt(h) * 3600 +
    parseInt(m) * 60 +
    parseInt(sec) +
    (parseInt(cs) || 0) / 100
  );
}

function groupTimings(timings: { start: number, end: number }[], numGroups: number): { start: number, end: number }[][] {
  // Evenly distribute timings into numGroups
  const groups: { start: number, end: number }[][] = [];
  let idx = 0;
  for (let i = 0; i < numGroups; ++i) {
    const group: { start: number, end: number }[] = [];
    const groupSize = Math.floor(timings.length / numGroups) + (i < timings.length % numGroups ? 1 : 0);
    for (let j = 0; j < groupSize; ++j) {
      if (idx < timings.length) group.push(timings[idx++]);
    }
    groups.push(group);
  }
  return groups;
}

async function main() {
  const runDir = fs.readFileSync('run_dir.txt', 'utf8').trim();
  const imagesDir = path.join(runDir, 'images');
  const audioPath = path.join(runDir, 'audio', 'final-mixed.mp3');
  const assPath = path.join(runDir, 'subtitles', 'final-mixed.ass');
  const videoDir = path.join(runDir, 'video');
  fs.mkdirSync(videoDir, { recursive: true });
  const tempVideo = path.join(videoDir, 'video_no_audio.mp4');

  // 1. Read image filenames from generation_report.json
  const reportPath = path.join(imagesDir, 'generation_report.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const imageFiles: string[] = report.images.map((img: any) => img.filename);

  // 2. Parse ASS timings
  const timings = parseAssDialogueTimings(assPath);
  // 3. Group timings into as many groups as images
  const groups = groupTimings(timings, imageFiles.length);

  // 4. Generate ffmpeg concat file
  const concatFile = path.join(runDir, 'images_concat.txt');
  let concatText = '';
  for (let i = 0; i < imageFiles.length; ++i) {
    const group = groups[i];
    const duration = group.reduce((sum, t) => sum + (t.end - t.start), 0);
    const imageFile = path.basename(imageFiles[i]);
    const absImagePath = path.resolve(imagesDir, imageFile);
    concatText += `file '${absImagePath}'\n`;
    concatText += `duration ${duration}\n`;
  }
  // ffmpeg requires the last file to be listed twice
  const lastImageFile = path.basename(imageFiles[imageFiles.length - 1]);
  const absLastImagePath = path.resolve(imagesDir, lastImageFile);
  concatText += `file '${absLastImagePath}'\n`;
  fs.writeFileSync(concatFile, concatText, 'utf8');

  // 5. Create video from images
  console.log('Creating video from images...');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -vsync vfr -pix_fmt yuv420p "${tempVideo}"`, { stdio: 'inherit' });
  console.log('✅ Video from images created at:', tempVideo);
}

main();