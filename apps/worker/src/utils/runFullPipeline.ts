import 'dotenv/config';
import { OutputManager } from './pipeline/output/outputManager';
import generateVideoScript from './pipeline/script/openaiScriptGenerator';
// import generateVoiceWithVoCloner from './pipeline/voice/generateVoiceWithVoCloner';
import { resembleTTS } from './pipeline/voice/resembleTTS';
import { generateDiaTts } from './pipeline/voice/diaTtsGenerator';
import { mixAudio } from './pipeline/audio/mixAudio';
import { transcribeAndGenerateSrt } from './pipeline/subtitles/generateAssFromAudio';
import ScriptImageGenerator from './pipeline/images/scriptToImageGenerator';
import { attachAudioToVideo } from './pipeline/video/attachAudioToVideo';
import { burnSubtitles } from './pipeline/video/burnSubtitles';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { openaiTTS } from './pipeline/voice/openaiTTS';

// Config array for script-to-image prompt generation
const IMAGE_PROMPT_CONFIGS = [
  {
    provider: 'openai',
    model: 'gpt-4.1-nano',
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  {
    provider: 'google',
    model: 'models/gemini-2.0-flash',
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
  },
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  {
    provider: 'xai',
    model: 'grok-1',
    apiKey: process.env.XAI_API_KEY || '',
  },
];

export async function runFullPipeline({
  prompt,
  persona,
  style,
  maxLength,
  model,
  provider,
  promptStyle
}: {
  prompt: string;
  persona: string;
  style: string;
  maxLength: number;
  model: string;
  provider: string;
  promptStyle: 'dev-meme' | 'documentary' | 'dialogue' | 'narrator' | 'what-if';
}, onProgress?: (percent: number, step: string) => void): Promise<string> {
  // 1. Script Generation
  onProgress?.(10, 'Script Generation');
  const om = new OutputManager();
  const runDir = om.setupRunDirs(prompt);
  fs.writeFileSync('run_dir.txt', runDir, 'utf8');

  // Actually generate the script file
  const scriptDir = path.join(runDir, 'script');
  await generateVideoScript({
    prompt,
    persona,
    style,
    maxLength,
    model,
    provider: provider as 'openai' | 'google' | 'anthropic' | 'cohere' | undefined,
    outputDir: scriptDir,
    promptStyle
  });

  // 2. Voice Generation
  onProgress?.(30, 'Voiceover Generation');
  const scriptFiles = fs.readdirSync(scriptDir).filter(f => f.endsWith('.txt'));
  const script = fs.readFileSync(path.join(scriptDir, scriptFiles[0]), 'utf8');
  const voicePath = path.join(runDir, 'audio', 'voice-Gojo.mp3');
  // await generateVoiceWithVoCloner(script, voicePath, 'Gojo');
  await openaiTTS({ input: script, outPath: voicePath });
  onProgress?.(35, 'Voice Generated');

  // // 3. Voice Generation(using dia tts)
  // console.log('Step 3: Generating voice...');
  // const voicePath = path.join(runDir, 'audio', 'voice-luffy-zoro.mp3');
  // const voiceClonePath = path.join(__dirname, '../../public/vocals/luffyandzorobutwithswitchedvoicescleanversion [vocals].mp3');

  // const apiKey = process.env.SEGMIND_API_KEY;
  // if (!apiKey) {
  //   throw new Error('SEGMIND_API_KEY is not set in environment variables');
  // }

  // await generateDiaTts({
  //   text: script,
  //   outputPath: voicePath,
  //   apiKey,
  //   temperature: 1.3,
  //   speed_factor: 0.85,
  //   input_audio: voiceClonePath
  // });

  // 3. Audio Mixing
  onProgress?.(45, 'Audio Mixing');
  const musicPath = path.join(__dirname, '../../public/bgm/ai-video-bgm.mp3');
  const mixedPath = path.join(runDir, 'audio', 'final-mixed.mp3');
  await mixAudio({
    voicePath,
    musicPath,
    outputPath: mixedPath,
    musicVolumeDb: -15,
  });

  // 4. Subtitle Generation
  onProgress?.(55, 'Subtitle Generation');
  const srtPath = path.join(runDir, 'subtitles', 'final-mixed.ass');
  await transcribeAndGenerateSrt(mixedPath, srtPath);

  // 5. Script-to-Image Generation
  onProgress?.(65, 'Image Generation');
  const imageOutDir = path.join(runDir, 'images');
  const { provider: imgProvider, model: imgModel, apiKey } = IMAGE_PROMPT_CONFIGS[0];
  const generator = new ScriptImageGenerator(apiKey, imageOutDir);
  await generator.generateImagesFromScript(
    script,
    '',
    true,
    imgProvider as 'openai' | 'google' | 'anthropic' | 'cohere',
    imgModel
  );

  // 6. Video Assembly
  onProgress?.(80, 'Video Assembly');
  execSync(`npx ts-node ${path.join(__dirname, './pipeline/video/stitchImagesToVideo.ts')}`, { stdio: 'inherit' });

  // 7. Attach Audio to Video
  onProgress?.(90, 'Attaching Audio');
  const videoNoAudio = path.join(runDir, 'video', 'video_no_audio.mp4');
  const finalVideo = path.join(runDir, 'final', 'final_video_with_audio.mp4');
  await attachAudioToVideo({
    videoPath: videoNoAudio,
    audioPath: mixedPath,
    outputPath: finalVideo,
  });

  // 8. Burn Subtitles
  onProgress?.(95, 'Burning Subtitles');
  const finalWithSubs = path.join(runDir, 'final', 'final_video_with_audio_and_subs.mp4');
  await burnSubtitles({
    videoPath: finalVideo,
    assPath: srtPath,
    outputPath: finalWithSubs,
  });

  // 9. Done
  onProgress?.(100, 'Done');

  return finalWithSubs;
}

// if (require.main === module) {
//   (async () => {
//     try {
//       const result = await runFullPipeline({
//         prompt: 'how the zip file works',
//         persona: 'excellent tech educator in simple terms',
//         style: 'tech narrative',
//         maxLength: 900,
//         model: 'gpt-4.1-nano',
//         provider: 'openai',
//         promptStyle: 'narrator'
//       });
//       console.log('Pipeline finished. Output:', result);
//     } catch (err) {
//       console.error('Pipeline failed:', err);
//       process.exit(1);
//     }
//   })();
// }