import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

export async function burnSubtitles({
  videoPath,
  assPath,
  outputPath,
}: {
  videoPath: string;
  assPath: string;
  outputPath: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .setFfmpegPath(ffmpegPath as string)
      .input(videoPath)
      .outputOptions([
        `-vf ass=${assPath}`,
        '-c:a copy'
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// // Example usage as a script:
// if (require.main === module) {
//   (async () => {
//     const runDir = fs.readFileSync('run_dir.txt', 'utf8').trim();
//     const inputVideo = path.join(runDir, 'final', 'final_output.mp4');
//     const assPath = path.join(runDir, 'subtitles', 'final-mixed.ass');
//     const outputVideo = path.join(runDir, 'final', 'final_with_subs.mp4');
//     await burnSubtitles({
//       videoPath: inputVideo,
//       assPath,
//       outputPath: outputVideo,
//     });
//     console.log('✅ Subtitles burned in. Output:', outputVideo);
//   })();
// }