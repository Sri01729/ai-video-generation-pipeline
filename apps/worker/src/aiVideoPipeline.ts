import 'dotenv/config';
import generateScript from './utils/openaiScriptGenerator';
import { generateDiaTts } from './utils/diaTtsGenerator';
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
    console.log('Step 1: Generating script...');
    const script = await generateScript(prompt);
    const scriptPath = 'public/scripts/script.txt';
    fs.writeFileSync(scriptPath, script);
    if (!fs.existsSync(scriptPath)) throw new Error('Script file not created.');
    console.log('Step 1 complete: Script generated:', scriptPath);

    // 2. Voice Generation
    console.log('Step 2: Generating voice...');
    const voicePath = `public/audiofiles/thanos-voice${Date.now()}.mp3`;
    await generateDiaTts({
      text: script,
      outputPath: voicePath,
      apiKey: process.env.SEGMIND_API_KEY!,
      // Optionally add more params here
    });
    if (!fs.existsSync(voicePath)) throw new Error('Voice file not created.');
    console.log('Step 2 complete: Voice generated:', voicePath);

    // 3. Mix Voice with BGM
    console.log('Step 3: Mixing audio...');
    const mixedAudioPath = 'public/audiofiles/final-mixed.mp3';
    await mixAudio({
      voicePath,
      musicPath: bgmPath,
      outputPath: mixedAudioPath,
      musicVolumeDb: -15,
    });
    if (!fs.existsSync(mixedAudioPath)) throw new Error('Mixed audio file not created.');
    console.log('Step 3 complete: Audio mixed:', mixedAudioPath);

    // 4. Attach Audio to Video
    console.log('Step 4: Attaching audio to video...');
    const videoWithAudioPath = 'public/videos/final-video.mp4';
    await attachAudioToVideo({
      videoPath,
      audioPath: mixedAudioPath,
      outputPath: videoWithAudioPath,
    });
    if (!fs.existsSync(videoWithAudioPath)) throw new Error('Video with audio file not created.');
    console.log('Step 4 complete: Video with audio created:', videoWithAudioPath);

    // 5. Generate Animated ASS Subtitles
    console.log('Step 5: Generating ASS subtitles...');
    const assPath = 'public/subtitles/final-mixed.ass';
    await transcribeAndGenerateAss(mixedAudioPath, assPath);
    if (!fs.existsSync(assPath)) throw new Error('ASS subtitle file not created.');
    console.log('Step 5 complete: ASS subtitles generated:', assPath);

    // 6. Burn Subtitles into Video
    console.log('Step 6: Burning subtitles into video...');
    const finalVideoPath = 'public/finalOutput/final-video-with-subs.mp4';
    await burnSubtitles({
      videoPath: videoWithAudioPath,
      assPath,
      outputPath: finalVideoPath,
    });
    if (!fs.existsSync(finalVideoPath)) throw new Error('Final video with subtitles not created.');
    console.log('Step 6 complete: Final video with subtitles created:', finalVideoPath);

    return finalVideoPath;
  } catch (err) {
    console.error('Pipeline failed at step:', err);
    throw err;
  }
}

async function main() {
  await aiVideoPipeline({
    prompt: `Explain the concept of sql injection in a 60-second video. explain it less than 1000 characters`,
    bgmPath: 'public/ai-video-bgm.mp3',
    videoPath: 'public/videos/Background-video.mp4',
    outputDir: 'public/finalOutput',
  });
}

main();
