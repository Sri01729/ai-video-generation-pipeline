import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

export async function mixAudio({
  voicePath,
  musicPath,
  outputPath,
  musicVolumeDb = -25,
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
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// async function main() {
//   await mixAudio({
//     voicePath: '../../public/audiofiles/thanos-explaining-javascript.mp3',
//     musicPath: '../../public/ai-video-bgm.mp3',
//     outputPath: '../../public/audiofiles/final-mixed.mp3',
//     musicVolumeDb: -15,
//   });
// }

// main();