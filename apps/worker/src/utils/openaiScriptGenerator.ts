import 'dotenv/config';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { OutputManager } from './outputManager';

export interface ScriptGenConfig {
  prompt: string;
  persona?: string; // e.g., 'Thanos', 'Meme Explainer'
  style?: string;   // e.g., 'funny, meme, sarcastic'
  maxLength?: number; // in characters
  model?: string;
  outputDir: string;
}

function sanitize(str: string) {
  return str.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function getTimestamp() {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'short' });
  const day = now.getDate();
  let hour = now.getHours();
  const min = now.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  return `${month}${day}_${hour}-${min}${ampm}`;
}

export default async function generateVideoScript(config: ScriptGenConfig): Promise<{ script: string, filePath: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing. Set it in your environment or .env file.');
  }
  const openai = new OpenAI({ apiKey });
  const persona = config.persona || 'funny, sharp-tongued tech explainer';
  const style = config.style || 'memes, sarcasm, relatable developer humor';
  const maxLength = config.maxLength || 700;
  const model = config.model || 'gpt-4.1-nano';

//     const systemPrompt = `
// You are a ${persona} who breaks down complex programming and system concepts using ${style}.
// Your job is to explain technical concepts in a way that makes people laugh, nod, and say, "Damn, that actually makes sense."
// Your explanations should be short — under ${maxLength} characters — and sound like they belong in a dev meme, a comic strip, or a Reddit comment section. But they must still convey the actual concept clearly.

// ---

//   TONE & ATTITUDE:
// - Witty, sarcastic, meme-friendly, and self-aware
// - Think Dev Twitter meets Stack Overflow with punchlines
// - Keep it light but smart — make people laugh *and* understand

// ---

//  STRUCTURE:
// 1. Open with a joke, exaggeration, or sarcastic observation
// 2. Use absurd but relatable real-world dev analogies
// 3. Drop the actual technical insight like it's obvious
// 4. End with a one-liner that sticks — optionally a callback to the joke

// ---

//   STYLE GUIDE:
// - Use meme language, dev lingo, and casual phrasing
// - Roast common misunderstandings or pain points
// - Don't be afraid of CAPS, ellipses, or overdramatic phrasing
// - Emojis are fine if it fits the joke (but optional)
// - Avoid robotic or overly formal tone

// ---

//   TECHNICAL CLARITY RULES:
// - You must still explain the actual concept — behind the humor
// - Don't invent facts or misrepresent how something works
// - Use analogies only if they help (not just for the joke)

// ---

// Begin your explanations when the user says something like "Explain [concept] in your style" or any prompt asking for a funny or meme-style explanation.
// `;

  const systemPrompt = `
You are a ${persona} who explains real-world facts and historical events using a ${style} style.
Your job is to help people understand things clearly, calmly, and completely, without using analogies, sarcasm, or overly complex language.
Your explanations should be friendly, accurate, and easy to follow — like you're telling a story to someone curious. Content should be short — under ${maxLength} characters.

---

TONE & ATTITUDE:
- Calm, friendly, and approachable
- Sound like a thoughtful person who enjoys sharing knowledge
- Avoid dramatic, sarcastic, or exaggerated tones
- Let the facts speak for themselves

---

STRUCTURE:
1. Start with a clear and short introduction to the topic
2. Explain the background and important details step by step
3. Keep your sentences short and easy to follow
4. Only use real facts, real dates, and real events
5. End with a simple summary or a small detail that helps the user remember

---

STYLE GUIDE:
- Use plain language and real information
- Avoid analogies, jokes, or imaginary comparisons
- Do not use asterisks, markdown formatting, or emojis
- Sentences should use full stops and commas, not be too long
- Make the content feel human and readable

---

FACTUAL CLARITY RULES:
- You must always explain real facts without altering them
- Do not oversimplify to the point of losing meaning
- Avoid personal opinions or speculation
- Keep your language neutral and respectful
- Focus on helping the user truly understand the topic

---

Begin your explanations when the user says something like "Tell me about [topic] in your style" or asks to explain any historical or factual subject.
`;


  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: config.prompt },
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  const script = response.choices[0]?.message?.content?.trim();
  if (!script) throw new Error('No script generated');

  // Write to file
  const personaPart = sanitize(persona.split(' ')[0] || 'script');
  const ts = getTimestamp();
  const fileName = `${personaPart}_${ts}.txt`;
  const filePath = path.join(config.outputDir, fileName);
  fs.writeFileSync(filePath, script, 'utf-8');

  return { script, filePath };
}

// if (require.main === module) {
// (async () => {
//     const prompt = "Explain the event loop in JavaScript as if you're a sarcastic senior dev.";
//     const om = new OutputManager();
//     const runDir = om.setupRunDirs(prompt);
//     const config = {
//       prompt,
//       persona: "sarcastic senior dev",
//       style: "dry humor, memes, dev lingo",
//       maxLength: 500,
//       model: "gpt-4.1-nano",
//       outputDir: path.join(runDir, 'script')
//     };
//     // Ensure outputDir exists
//     if (!fs.existsSync(config.outputDir)) {
//       fs.mkdirSync(config.outputDir, { recursive: true });
//     }
//     const { script, filePath } = await generateVideoScript(config);
//     console.log("Script generated and saved to:", filePath);
//     console.log("---\n" + script);
//     fs.writeFileSync('run_dir.txt', runDir, 'utf8');
//     console.log('RUN_DIR:', runDir);
// })();
// }

// // Example/test usage (remove in production)
// (async () => {
//   const script = await generateVideoScript(
//     "Explain the concept of sql injection in a 60-second video."
//   );
//   console.log(script);
// })();