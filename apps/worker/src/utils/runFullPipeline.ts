import { OutputManager } from './outputManager';
import generateVideoScript from './openaiScriptGenerator';
import generateVoiceWithVoCloner from './generateVoiceWithVoCloner';
import { generateDiaTts } from './diaTtsGenerator';
import { mixAudio } from './mixAudio';
import { transcribeAndGenerateSrt } from './generateAssFromAudio';
import ScriptImageGenerator from './scriptToImageGenerator';
import { attachAudioToVideo } from './attachAudioToVideo';
import { burnSubtitles } from './burnSubtitles';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function runPipeline() {
  // 1. Script Generation
  const prompt = "What if all the data centers in the world gets bombed?";
  const om = new OutputManager();
  const runDir = om.setupRunDirs(prompt);
  fs.writeFileSync('run_dir.txt', runDir, 'utf8');

  // Actually generate the script file
  const scriptDir = path.join(runDir, 'script');
  await generateVideoScript({
    prompt,
    persona: 'A calm, intelligent narrator with a hint of unease',
    style: 'Suspenseful, reflective, cinematic',
    maxLength: 950,
    model: 'gpt-4.1-nano',
    outputDir: scriptDir,
  });

  // Now read the script file
  const scriptFiles = fs.readdirSync(scriptDir).filter(f => f.endsWith('.txt'));
  const script = fs.readFileSync(path.join(scriptDir, scriptFiles[0]), 'utf8');

  // 3. Voice Generation
  const voicePath = path.join(runDir, 'audio', 'voice-Gojo.mp3');
  await generateVoiceWithVoCloner(script, voicePath, 'Gojo');

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

  // 4. Audio Mixing
  const musicPath = path.join(__dirname, '../../public/bgm/ai-video-bgm.mp3');
  const mixedPath = path.join(runDir, 'audio', 'final-mixed.mp3');
  await mixAudio({
    voicePath,
    musicPath,
    outputPath: mixedPath,
    musicVolumeDb: -15,
  });

  // 5. Subtitle Generation
  const srtPath = path.join(runDir, 'subtitles', 'final-mixed.ass');
  await transcribeAndGenerateSrt(mixedPath, srtPath);

  // 6. Script-to-Image Generation
  const imageOutDir = path.join(runDir, 'images');
  const API_KEY = process.env.OPENAI_API_KEY ?? '';
  const generator = new ScriptImageGenerator(API_KEY, imageOutDir);
  await generator.generateImagesFromScript(script, '', true);

  // 7. Stitch Images to Video (no audio)
  execSync(`npx ts-node ${path.join(__dirname, 'stitchImagesToVideo.ts')}`, { stdio: 'inherit' });

  // 8. Attach Audio to Video
  const videoNoAudio = path.join(runDir, 'video', 'video_no_audio.mp4');
  const finalVideo = path.join(runDir, 'final', 'final_video_with_audio.mp4');
  await attachAudioToVideo({
    videoPath: videoNoAudio,
    audioPath: mixedPath,
    outputPath: finalVideo,
  });

  // 9. Burn Subtitles
  await burnSubtitles({
    videoPath: finalVideo,
    assPath: srtPath,
    outputPath: path.join(runDir, 'final', 'final_video_with_audio_and_subs.mp4'),
  });

  console.log('✅ Full pipeline complete! Output:', path.join(runDir, 'final', 'final_with_subs.mp4'));
}

runPipeline().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});