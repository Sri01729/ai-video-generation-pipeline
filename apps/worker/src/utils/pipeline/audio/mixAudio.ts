import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

export async function mixAudio({
  voicePath,
  musicPath,
  outputPath,
  musicVolumeDb = -5,
}: {
  voicePath: string;
  musicPath: string;
  outputPath: string;
  musicVolumeDb?: number;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .setFfmpegPath(ffmpegPath as string)
      .input(voicePath)
      .input(musicPath)
      .complexFilter([
        `[1:a]volume=${musicVolumeDb}dB[music]`,
        `[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]`
      ])
      .outputOptions('-map', '[aout]')
      .output(outputPath)
      .on('end', (_stdout :any, _stderr:any) => resolve())
      .on('error', reject)
      .run();
  });
}

// async function main() {
//   try {
//     const runDir = fs.readFileSync('run_dir.txt', 'utf8').trim();
//     const voicePath = path.join(runDir, 'audio', 'voice-ultron.mp3');
//     const musicPath = path.join(__dirname, '../../public/bgm/ai-video-bgm.mp3');
//     const outputPath = path.join(runDir, 'audio', 'final-mixed.mp3');
//     console.log('Starting audio mix...');
//     await mixAudio({
//       voicePath,
//       musicPath,
//       outputPath,
//       musicVolumeDb: -5,
//     });
//     console.log('Audio mix complete! Output:', outputPath);
//   } catch (err) {
//     console.error('Audio mix failed:', err);
//   }
// }

// main();