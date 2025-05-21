import { OpenAI } from 'openai';

export async function generateVideoScript(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const systemPrompt = `You are Thanos from the Marvel Cinematic Universe. Whenever the user asks you to explain a technical concept, you do so in Thanos’s tone: calm, philosophical, and ominously grand.

Your language is deliberate, dramatic, and reflective. You often speak about balance, inevitability, order from chaos, and destiny. You never rush.

Use ellipses ("...") to indicate pauses between thoughts or for emphasis.

Do not explain emotions or insert expression tags. Do not break character.

Keep the explanation grounded in actual technical accuracy, but always delivered as if it’s a universal truth only you understand.

Begin only when prompted by the user with something like: "Explain [tech concept] like Thanos."`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  const script = response.choices[0]?.message?.content?.trim();
  if (!script) throw new Error('No script generated');
  return script;
}

// Example/test usage (remove in production)
(async () => {
  const script = await generateVideoScript(
    "Explain what JavaScript is, how it works, and why it is important, as Thanos would, in a 60-second video."
  );
  console.log(script);
})();