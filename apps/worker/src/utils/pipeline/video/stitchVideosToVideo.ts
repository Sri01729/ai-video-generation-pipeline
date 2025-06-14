import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function parseAssDialogueTimings(assPath: string): { start: number, end: number }[] {
  const ass = fs.readFileSync(assPath, 'utf8');
  const lines = ass.split(/\r?\n/);
  const timings: { start: number, end: number }[] = [];
  for (const line of lines) {
    if (line.startsWith('Dialogue:')) {
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
  const [h, m, s] = assTime.split(':');
  const [sec, cs] = s.split('.');
  return (
    parseInt(h) * 3600 +
    parseInt(m) * 60 +
    parseInt(sec) +
    (parseInt(cs) || 0) / 100
  );
}

async function main() {
  const runDir = fs.readFileSync('run_dir.txt', 'utf8').trim();
  const videoDir = path.join(runDir, 'images');
  const audioPath = path.join(runDir, 'audio', 'final-mixed.mp3');
  const assPath = path.join(runDir, 'subtitles', 'final-mixed.ass');
  const outDir = path.join(runDir, 'video');
  fs.mkdirSync(outDir, { recursive: true });
  const tempDir = path.join(outDir, 'temp');
  fs.mkdirSync(tempDir, { recursive: true });
  const finalVideo = path.join(outDir, 'final.mp4');

  // 1. Read video filenames from generation_report.json
  const reportPath = path.join(videoDir, 'generation_report.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const videoFiles = report.videos.map((v: any) => path.join(videoDir, v.filename));

  // 2. Parse ASS timings
  const timings = parseAssDialogueTimings(assPath);
  // 3. Group timings into as many groups as videos
  function groupTimings(timings: { start: number, end: number }[], numGroups: number): { start: number, end: number }[][] {
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
  const groups = groupTimings(timings, videoFiles.length);

  // 4. For each video, trim or pad to match duration
  const processedVideos: string[] = [];
  for (let i = 0; i < videoFiles.length; ++i) {
    const video = videoFiles[i];
    const group = groups[i];
    const duration = group.reduce((sum, t) => sum + (t.end - t.start), 0);
    const processed = path.join(tempDir, `scene_${i + 1}_processed.mp4`);
    // Get video duration
    let videoDuration = 0;
    try {
      const ffprobeOut = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${video}"`).toString().trim();
      videoDuration = parseFloat(ffprobeOut);
    } catch (e) {
      throw new Error('Failed to get video duration for ' + video);
    }
    if (videoDuration > duration + 0.05) {
      // Trim
      console.log(`[Trim] ${path.basename(video)}: trimming to ${duration}s (was ${videoDuration}s)`);
      execSync(`ffmpeg -y -i "${video}" -t ${duration} -c copy "${processed}"`);
    } else if (videoDuration < duration - 0.05) {
      // Pad (freeze last frame)
      console.log(`[Pad] ${path.basename(video)}: padding to ${duration}s (was ${videoDuration}s)`);
      execSync(`ffmpeg -y -i "${video}" -vf tpad=stop_mode=clone:stop_duration=${duration - videoDuration} -t ${duration} -c:v libx264 -pix_fmt yuv420p -c:a copy "${processed}"`);
    } else {
      // No change
      fs.copyFileSync(video, processed);
    }
    processedVideos.push(processed);
  }

  // 5. Write ffmpeg concat file
  const concatFile = path.join(tempDir, 'concat.txt');
  const concatText = processedVideos.map((f: string) => `file '${f}'`).join('\n');
  fs.writeFileSync(concatFile, concatText, 'utf8');

  // 6. Concat videos
  const tempConcatVideo = path.join(outDir, 'video_no_audio.mp4');
  console.log('Concatenating processed videos...');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${tempConcatVideo}"`, { stdio: 'inherit' });

  // 7. Add audio and subtitles if present
  let ffmpegCmd = `ffmpeg -y -i "${tempConcatVideo}"`;
  if (fs.existsSync(audioPath)) {
    ffmpegCmd += ` -i "${audioPath}"`;
  }
  if (fs.existsSync(assPath)) {
    ffmpegCmd += ` -vf subtitles='${assPath.replace(/'/g, "'\\''")}' -c:v libx264 -pix_fmt yuv420p`;
  } else {
    ffmpegCmd += ' -c:v copy';
  }
  if (fs.existsSync(audioPath)) {
    ffmpegCmd += ' -c:a aac -shortest';
  } else {
    ffmpegCmd += ' -c:a copy';
  }
  ffmpegCmd += ` "${finalVideo}"`;
  console.log('Adding audio/subtitles (if present) and writing final video...');
  execSync(ffmpegCmd, { stdio: 'inherit' });
  console.log('✅ Final video created at:', finalVideo);
}

main();