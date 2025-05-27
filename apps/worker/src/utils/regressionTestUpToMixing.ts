import path from 'path';
import fs from 'fs';
import { OutputManager } from './outputManager';
import generateVideoScript from './openaiScriptGenerator';
import generateVoiceWithVoCloner from './generateVoiceWithVoCloner';
import { mixAudio } from './mixAudio';

async function regressionTest() {
  const prompt = "Explain the event loop in JavaScript as if you're Ultron.";
  const om = new OutputManager();
  const runDir = om.setupRunDirs(prompt);

  // 1. Script Generation
  const scriptOutDir = path.join(runDir, 'script');
  if (!fs.existsSync(scriptOutDir)) fs.mkdirSync(scriptOutDir, { recursive: true });
  const { script, filePath: scriptPath } = await generateVideoScript({
    prompt,
    persona: 'Ultron',
    style: 'robot overlord, dry humor',
    maxLength: 500,
    model: 'gpt-4.1-nano',
    outputDir: scriptOutDir,
  });
  console.log('Script generated at:', scriptPath);

  // 2. Voice Generation
  const voicePath = path.join(runDir, 'audio', 'voice-ultron.mp3');
  if (!fs.existsSync(path.dirname(voicePath))) fs.mkdirSync(path.dirname(voicePath), { recursive: true });
  await generateVoiceWithVoCloner(script, voicePath, 'Ultron');
  console.log('Voice generated at:', voicePath);

  // 3. Audio Mixing
  const musicPath = path.join(__dirname, '../../public/bgm/ai-video-bgm.mp3');
  const mixedPath = path.join(runDir, 'audio', 'final-mixed.mp3');
  await mixAudio({
    voicePath,
    musicPath,
    outputPath: mixedPath,
    musicVolumeDb: -15,
  });
  console.log('Audio mixed at:', mixedPath);
}

if (require.main === module) {
  regressionTest().catch(err => {
    console.error('Regression test failed:', err);
    process.exit(1);
  });
}