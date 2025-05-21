import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import 'dotenv/config';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function transcribeAndGenerateSrt(audioPath: string, srtPath: string) {
  // Upload local file
  const uploadUrl = await client.files.upload(audioPath);

  // Start transcription with word-level timestamps
  const transcript = await client.transcripts.transcribe({
    audio: uploadUrl,
    punctuate: true,
    format_text: true,
    speaker_labels: false,
    word_boost: [],
    boost_param: 'high',
  });

  // Wait for completion (polling)
  let completedTranscript = transcript;
  while (completedTranscript.status !== 'completed') {
    if (completedTranscript.status === 'error') throw new Error(completedTranscript.error);
    await new Promise(res => setTimeout(res, 5000));
    completedTranscript = await client.transcripts.get(transcript.id);
  }

  // Generate SRT
  const srt = wordsToSrt(completedTranscript.words ?? []);
  fs.writeFileSync(srtPath, srt, 'utf8');
}

// Helper: Convert AssemblyAI words array to SRT format
function wordsToSrt(words: any[]): string {
  if (!words || !words.length) return '';
  let srt = '';
  let idx = 1;
  let group: any[] = [];
  for (let i = 0; i < words.length; i++) {
    group.push(words[i]);
    // Group by sentence or every ~7 words
    if (group.length >= 7 || words[i].punctuation === '.' || i === words.length - 1) {
      const start = msToSrtTime(group[0].start);
      const end = msToSrtTime(group[group.length - 1].end);
      const text = group.map(w => w.text).join(' ');
      srt += `${idx++}\n${start} --> ${end}\n${text}\n\n`;
      group = [];
    }
  }
  return srt;
}

function msToSrtTime(ms: number) {
  const date = new Date(ms);
  return date.toISOString().substr(11, 8) + ',' + String(ms % 1000).padStart(3, '0');
}

// ... existing code ...

async function main() {
  await transcribeAndGenerateSrt(
    '../../public/audiofiles/final-mixed.mp3',
    '../../public/subtitles/final-mixed.srt'
  );
  console.log('SRT generation complete.');
}

main();
