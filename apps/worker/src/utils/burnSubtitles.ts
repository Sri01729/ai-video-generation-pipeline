import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

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

//Example usage
async function main() {
  await burnSubtitles({
    videoPath: '../../public/videos/final-video.mp4',
    assPath: '../../public/subtitles/final-mixed.ass',
    outputPath: '../../public/videos/final-video-with-subs.mp4',
  });
  console.log('ASS subtitles burned into video.');

}
main();