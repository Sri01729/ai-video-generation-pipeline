import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

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
        '-c:v copy', // copy video stream
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

async function main() {
  await attachAudioToVideo({
    videoPath: '../../public/videos/cosmic-bg-mobile-video.mp4',
    audioPath: '../../public/audiofiles/final-mixed.mp3',
    outputPath: '../../public/videos/final-video.mp4',
  });
}

main();