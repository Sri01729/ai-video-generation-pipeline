import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

export async function attachAudioToVideo({
  videoPath,
  audioPath,
  outputPath,
}: {
  videoPath: string;
  audioPath: string;
  outputPath: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .setFfmpegPath(ffmpegPath as string)
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v libx264', // re-encode video for subtitle burning
        '-map 0:v:0', // use video from first input
        '-map 1:a:0', // use audio from second input
        '-shortest'   // end output when shortest stream ends
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// async function main() {
//   const runDir = fs.readFileSync('run_dir.txt', 'utf8').trim();
//   await attachAudioToVideo({
//     videoPath: path.join(runDir, 'final', 'video_no_audio.mp4'),
//     audioPath: path.join(runDir, 'audio', 'final-mixed.mp3'),
//     outputPath: path.join(runDir, 'final', 'final_output.mp4'),
//   });
//   console.log('✅ Audio attached to video. Output:', path.join(runDir, 'final', 'final_output.mp4'));
// }

// main();