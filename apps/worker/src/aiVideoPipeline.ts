import generateScript from './utils/openaiScriptGenerator';
import generateVoice from './utils/voclonerGoogleLoginTest';
import { mixAudio } from './utils/mixAudio';
import { attachAudioToVideo } from './utils/attachAudioToVideo';
import { transcribeAndGenerateSrt as transcribeAndGenerateAss } from './utils/generateAssFromAudio';
import { burnSubtitles } from './utils/burnSubtitles';
import fs from 'fs';
import path from 'path';

function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function aiVideoPipeline({
  prompt,
  bgmPath,
  videoPath,
  outputDir,
}: {
  prompt: string;
  bgmPath: string;
  videoPath: string;
  outputDir: string;
}) {
  try {
    // Ensure all output directories exist
    ensureDirExists('public/scripts');
    ensureDirExists('public/audiofiles');
    ensureDirExists('public/videos');
    ensureDirExists('public/subtitles');
    ensureDirExists('public/finalOutput');

    // 1. Script Generation
    const script = await generateScript(prompt);
    const scriptPath = 'public/scripts/script.txt';
    fs.writeFileSync(scriptPath, script);
    console.log('Script generated:', scriptPath);
    if (!fs.existsSync(scriptPath)) throw new Error('Script file not created.');

    // 2. Voice Generation
    const voicePath = `public/audiofiles/thanos-voice${Date.now()}.mp3`;
    await generateVoice(script, voicePath);
    console.log('Voice generated:', voicePath);
    if (!fs.existsSync(voicePath)) throw new Error('Voice file not created.');

    // 3. Mix Voice with BGM
    const mixedAudioPath = 'public/audiofiles/final-mixed.mp3';
    await mixAudio({
      voicePath,
      musicPath: bgmPath,
      outputPath: mixedAudioPath,
      musicVolumeDb: -15,
    });
    console.log('Audio mixed:', mixedAudioPath);
    if (!fs.existsSync(mixedAudioPath)) throw new Error('Mixed audio file not created.');

    // 4. Attach Audio to Video
    const videoWithAudioPath = 'public/videos/final-video.mp4';
    await attachAudioToVideo({
      videoPath,
      audioPath: mixedAudioPath,
      outputPath: videoWithAudioPath,
    });
    console.log('Video with audio created:', videoWithAudioPath);
    if (!fs.existsSync(videoWithAudioPath)) throw new Error('Video with audio file not created.');

    // 5. Generate Animated ASS Subtitles
    const assPath = 'public/subtitles/final-mixed.ass';
    await transcribeAndGenerateAss(mixedAudioPath, assPath);
    console.log('ASS subtitles generated:', assPath);
    if (!fs.existsSync(assPath)) throw new Error('ASS subtitle file not created.');

    // 6. Burn Subtitles into Video
    const finalVideoPath = 'public/finalOutput/final-video-with-subs.mp4';
    await burnSubtitles({
      videoPath: videoWithAudioPath,
      assPath,
      outputPath: finalVideoPath,
    });
    console.log('Final video with subtitles created:', finalVideoPath);
    if (!fs.existsSync(finalVideoPath)) throw new Error('Final video with subtitles not created.');

    return finalVideoPath;
  } catch (err) {
    console.error('Pipeline failed at step:', err);
    throw err;
  }
}

async function main() {
  await aiVideoPipeline({
    prompt: `Explain why JavaScript is asynchronous not because of the language itself, but because of external support systems — like Web APIs in the browser and libuv in Node.js. Make the explanation simple, engaging, and beginner-friendly, with analogies if needed — so that even someone new to programming can understand it. explain it less than 1000 characters`,
    bgmPath: 'public/ai-video-bgm.mp3',
    videoPath: 'public/videos/Background-video.mp4',
    outputDir: 'public/finalOutput',
  });
}

main();
