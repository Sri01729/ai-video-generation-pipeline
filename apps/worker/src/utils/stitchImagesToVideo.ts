import { execSync } from 'child_process';
import path from 'path';

/**
 * Stitches 10 images into a video matching the length of the audio track.
 * Assumes images are named image_1.png, image_2.png, ..., image_10.png
 * and audio file is audio.mp3 in the same directory.
 *
 * @param {string} imagesDir - Directory containing images
 * @param {string} audioPath - Path to audio file
 * @param {string} outputPath - Path to output video
 */
export function stitchImagesToVideo(imagesDir: string, audioPath: string, outputPath: string) {
  const imagePattern = path.join(imagesDir, 'scene_%03d.png');

  // Get audio duration in seconds
  const duration = parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    ).toString().trim()
  );

  const numImages = 10;
  const framerate = numImages / duration;

  const ffmpegCmd = [
    'ffmpeg',
    `-framerate ${framerate}`,
    `-i "${imagePattern}"`,
    `-i "${audioPath}"`,
    '-c:v libx264',
    '-r 30',
    '-pix_fmt yuv420p',
    '-shortest',
    '-vf "scale=1280:720,format=yuv420p"',
    `"${outputPath}"`
  ].join(' ');

  execSync(ffmpegCmd, { stdio: 'inherit' });
}

// Example usage:
 stitchImagesToVideo('./public/images', './public/final-mixed.mp3', './output.mp4');