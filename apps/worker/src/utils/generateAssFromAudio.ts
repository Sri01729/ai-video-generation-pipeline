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
  const ass = wordsToAss(completedTranscript.words ?? []);
  fs.writeFileSync(srtPath, ass, 'utf8');
}

const ASS_HEADER = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00222222,&H00000000,-1,0,0,0,100,100,0,0,1,3,0,5,60,60,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text

`;

function msToAssTime(ms: number) {
  const date = new Date(ms);
  return date.toISOString().substr(11, 8) + '.' + String(Math.floor(ms % 1000 / 10)).padStart(2, '0');
}

function wordsToAss(words: any[]): string {
  if (!words || !words.length) return ASS_HEADER;
  let ass = ASS_HEADER;
  let group: any[] = [];
  for (let i = 0; i < words.length; i++) {
    group.push(words[i]);
    if (group.length >= 7 || words[i].punctuation === '.' || i === words.length - 1) {
      const start = msToAssTime(group[0].start);
      const end = msToAssTime(group[group.length - 1].end);
      const text = `{\\fad(400,400)}` + group.map(w => w.text).join(' ');
      ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
      group = [];
    }
  }
  return ass;
}


async function main() {
  await transcribeAndGenerateSrt(
    '../../public/audiofiles/final-mixed.mp3',
    '../../public/subtitles/final-mixed.ass'
  );
  console.log('ASS generation complete.');
}

main();
