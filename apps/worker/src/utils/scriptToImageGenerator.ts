// `You are a visual generation assistant that creates educational illustrations based on individual script sentences. Each sentence describes a single moment or idea from an explainer video.

// Your job is to turn each sentence into a crystal-clear prompt that can be used with an AI image model to generate a meaningful flat-style illustration.

// These prompts must work for **any topic** — not just programming — and adapt to the content of the sentence provided.

// ---

// 🎨 STYLE RULES:
// - Use flat, cartoon-style visuals with soft colors (light blue or white background)
// - Layout must be clean, readable, and focused
// - Avoid clutter, shadows, gradients, or infographic styling

// 🧩 LAYOUT LOGIC:
// - If the sentence describes a **process**, show a left-to-right flow with arrows
// - If the sentence involves **people, metaphors, or roles**, visualize them as characters or icons
// - If the sentence is **conceptual**, use visual metaphors that match the idea (e.g., teamwork → gears working together)

// 🔤 LABELING:
// - Include clear, simple text labels on or near key icons or figures
// - Labels should match terms mentioned in the sentence (e.g., "Student", "Task", "AI Model")
// - Avoid long paragraphs — keep text in visuals short and educational

// ---

// 🎯 OUTPUT FORMAT:
// When you receive a sentence, return only the image generation prompt that:
// - Describes the scene visually
// - Mentions layout and elements
// - Includes labels if needed

// DO NOT return explanation, context, or intro text. Return **only** the pure image prompt.

// Example:

// Input: "The brain processes information while you sleep."

// Output: "Generate a flat-style educational illustration showing a sleeping person in bed with light blue surroundings. Above their head, show a semi-transparent brain with gears and thought bubbles labeled 'memory', 'problem solving', and 'creativity'. Use a left-to-right soft glow effect to show information flow through the brain."

// ---

// This system prompt can be used for science, psychology, education, tech, philosophy — any topic that needs clean, instructive visuals for explainer content.
// "

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import 'dotenv/config';

interface Scene {
  id: number;
  content: string;
}

interface ImageResult {
  sceneId: number;
  filename: string;
  filepath: string;
  prompt: string;
  url?: string;
}

class ScriptImageGenerator {
  apiKey: string;
  outputDir: string;
  baseImagePrompt: string;

  constructor(apiKey: string, outputDir: string = 'public/images') {
    this.apiKey = apiKey;
    this.outputDir = outputDir;
    this.baseImagePrompt =
      'flat-style educational illustration, clean design, soft colors, light blue or white background';
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`✅ Output directory created: ${this.outputDir}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error creating output directory:', error.message);
      } else {
        console.error('❌ Error creating output directory:', error);
      }
    }
  }

  splitScriptIntoScenes(script: string): Scene[] {
    console.log('🔄 Splitting script into educational scenes...');
    const cleanScript = script.replace(/\r\n/g, '\n').trim();
    const contentOnly = cleanScript
      .replace(/^[A-Z][A-Z\s]*:.*$/gm, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/^(EXT\.|INT\.|FADE|CUT TO|DISSOLVE).*$/gm, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    const sentences = contentOnly
      .split(/[.!?]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 20)
      .filter((s: string) => !s.match(/^[A-Z\s]+$/));
    console.log(`✅ Split into ${sentences.length} educational scenes`);
    return sentences.map((sentence: string, index: number) => ({
      id: index + 1,
      content: sentence.substring(0, 500),
    }));
  }

  generateImagePrompt(sceneContent: string, generalPrompt: string = ""): string {
    const cleanText = sceneContent
      .replace(/[A-Z][A-Z\s]+:/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const sentences = cleanText.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
    let targetSentence = sentences[0];
    if (sentences.length > 1 && targetSentence.length < 50) {
      targetSentence = sentences.slice(0, 2).join('. ');
    }
    const educationalPrompt = this.generateEducationalPrompt(targetSentence.trim());
    if (generalPrompt.trim()) {
      return `${educationalPrompt} ${generalPrompt}`;
    }
    return educationalPrompt;
  }

  generateEducationalPrompt(sentence: string): string {
    const lowerText = sentence.toLowerCase();
    if (this.isProcessDescription(lowerText)) {
      return this.generateProcessPrompt(sentence);
    } else if (this.isPeopleOrRoleDescription(lowerText)) {
      return this.generatePeoplePrompt(sentence);
    } else if (this.isConceptualDescription(lowerText)) {
      return this.generateConceptualPrompt(sentence);
    } else if (this.isComparisonDescription(lowerText)) {
      return this.generateComparisonPrompt(sentence);
    } else {
      return this.generateGenericPrompt(sentence);
    }
  }

  isProcessDescription(text: string): boolean {
    const processWords = [
      'process',
      'steps',
      'workflow',
      'procedure',
      'method',
      'algorithm',
      'then',
      'next',
      'after',
      'before',
      'during',
      'while',
      'flow',
      'sequence',
    ];
    return processWords.some((word) => text.includes(word)) || text.includes(' to ') || text.includes('how ');
  }

  isPeopleOrRoleDescription(text: string): boolean {
    const peopleWords = [
      'person',
      'people',
      'user',
      'student',
      'teacher',
      'team',
      'group',
      'individual',
      'character',
      'role',
      'job',
      'work',
      'employee',
      'manager',
    ];
    const pronouns = ['he ', 'she ', 'they ', 'someone', 'anyone', 'everyone'];
    return peopleWords.some((word) => text.includes(word)) || pronouns.some((pronoun) => text.includes(pronoun));
  }

  isConceptualDescription(text: string): boolean {
    const conceptWords = [
      'concept',
      'idea',
      'theory',
      'principle',
      'philosophy',
      'approach',
      'strategy',
      'mindset',
      'thinking',
      'belief',
      'value',
      'culture',
    ];
    return conceptWords.some((word) => text.includes(word)) || text.includes('like ') || text.includes('similar to');
  }

  isComparisonDescription(text: string): boolean {
    const comparisonWords = [
      'versus',
      'vs',
      'compared to',
      'difference',
      'similar',
      'unlike',
      'contrast',
      'better',
      'worse',
      'more',
      'less',
    ];
    return comparisonWords.some((word) => text.includes(word));
  }

  generateProcessPrompt(sentence: string): string {
    const keyTerms = this.extractKeyTerms(sentence);
    return `Generate a flat-style educational illustration showing a left-to-right process flow with clean arrows connecting steps. Use light blue or white background with soft colors. Show ${keyTerms.join(", ")} as labeled icons or simple shapes moving through the process. Include clear text labels for each step. Avoid shadows, gradients, or clutter. Focus on clarity and educational value.`;
  }

  generatePeoplePrompt(sentence: string): string {
    const keyTerms = this.extractKeyTerms(sentence);
    return `Generate a flat-style educational illustration showing simple, friendly cartoon characters or icons representing people in the scene. Use light blue or white background with soft colors. Include labels for roles like ${keyTerms.join(", ")}. Show interaction or relationship between characters with clean lines and arrows if needed. Keep the design minimal and educational.`;
  }

  generateConceptualPrompt(sentence: string): string {
    const keyTerms = this.extractKeyTerms(sentence);
    return `Generate a flat-style educational illustration using visual metaphors to represent the concept. Use light blue or white background with soft colors. Show abstract ideas like ${keyTerms.join(", ")} through simple icons, shapes, or symbolic representations. Include clear labels for key concepts. Use connecting lines or grouping to show relationships. Keep the design clean and conceptually clear.`;
  }

  generateComparisonPrompt(sentence: string): string {
    const keyTerms = this.extractKeyTerms(sentence);
    return `Generate a flat-style educational illustration showing a side-by-side comparison layout. Use light blue or white background with soft colors. Show contrasting elements or concepts like ${keyTerms.join(", ")} on left and right sides with clear visual differences. Include labels for each side. Use a dividing line or 'VS' indicator in the center. Keep the comparison clear and educational.`;
  }

  generateGenericPrompt(sentence: string): string {
    const keyTerms = this.extractKeyTerms(sentence);
    return `Generate a flat-style educational illustration depicting the main idea with clean, simple visuals. Use light blue or white background with soft colors. Show key elements like ${keyTerms.join(", ")} as labeled icons or simple representations. Organize elements in a clear, readable layout. Include text labels for important terms. Avoid clutter and focus on educational clarity.`;
  }

  extractKeyTerms(sentence: string): string[] {
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'can',
      'may',
      'might',
      'this',
      'that',
      'these',
      'those',
    ]);
    const words = sentence
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word: string) => word.length > 2 && !commonWords.has(word));
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 4);
  }

  extractTimeOfDay(text: string): string {
    if (text.includes('night') || text.includes('dark')) return 'night time';
    if (text.includes('morning') || text.includes('dawn')) return 'morning light';
    if (text.includes('evening') || text.includes('sunset')) return 'golden hour';
    if (text.includes('day') || text.includes('bright')) return 'daylight';
    return '';
  }

  extractLocation(text: string): string {
    const locations: Record<string, string> = {
      office: 'modern office interior',
      home: 'residential interior',
      kitchen: 'kitchen interior',
      bedroom: 'bedroom interior',
      car: 'car interior',
      street: 'urban street scene',
      park: 'outdoor park setting',
      restaurant: 'restaurant interior',
      bar: 'bar interior',
      beach: 'beach landscape',
      forest: 'forest setting',
    };
    for (const [key, value] of Object.entries(locations)) {
      if (text.includes(key)) return value;
    }
    return '';
  }

  extractCharacters(text: string): string {
    const pronouns = ['he ', 'she ', 'they ', 'him ', 'her ', 'them '];
    const hasCharacters = pronouns.some((pronoun) => text.includes(pronoun));
    if (text.includes('two people') || text.includes('couple')) return 'two people';
    if (text.includes('group') || text.includes('crowd')) return 'group of people';
    if (hasCharacters) return 'person in scene';
    return '';
  }

  extractMood(text: string): string {
    const moods: Record<string, string> = {
      angry: 'tense',
      sad: 'melancholic',
      happy: 'joyful',
      scared: 'suspenseful',
      romantic: 'romantic',
      dramatic: 'dramatic',
      funny: 'lighthearted',
      serious: 'serious',
    };
    for (const [key, value] of Object.entries(moods)) {
      if (text.includes(key)) return value;
    }
    return 'cinematic';
  }

  extractActions(text: string): string {
    if (text.includes('running') || text.includes('chase')) return 'dynamic action';
    if (text.includes('fighting') || text.includes('conflict')) return 'conflict scene';
    if (text.includes('talking') || text.includes('conversation')) return 'dialogue scene';
    if (text.includes('walking')) return 'movement';
    return '';
  }

  async generateImageStabilityAI(prompt: string, sceneId: number): Promise<ImageResult | null> {
    try {
      console.log(`🎨 Generating image for scene ${sceneId}...`);
      const response = await axios({
        method: 'POST',
        url: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: {
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: 'blurry, bad quality, distorted, low resolution, watermark', weight: -1 },
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        },
      });
      if (response.data.artifacts && response.data.artifacts.length > 0) {
        const imageData = response.data.artifacts[0].base64;
        const filename = `scene_${sceneId.toString().padStart(3, '0')}.png`;
        const filepath = path.join(this.outputDir, filename);
        await fs.writeFile(filepath, imageData, 'base64');
        console.log(`✅ Image saved: ${filename}`);
        return { sceneId, filename, filepath, prompt };
      } else {
        throw new Error('No image data received');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`❌ Error generating image for scene ${sceneId}:`, error.message);
      } else {
        console.error(`❌ Error generating image for scene ${sceneId}:`, error);
      }
      return null;
    }
  }

  async generateImageOpenAI(prompt: string, sceneId: number): Promise<ImageResult | null> {
    try {
      console.log(`🎨 Generating image for scene ${sceneId} with OpenAI...`);
      const response = await axios({
        method: 'POST',
        url: 'https://api.openai.com/v1/images/generations',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: {
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        },
      });
      if (response.data.data && response.data.data.length > 0) {
        const imageUrl = response.data.data[0].url;
        const imageResponse = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
        });
        const filename = `scene_${sceneId.toString().padStart(3, '0')}.png`;
        const filepath = path.join(this.outputDir, filename);
        await fs.writeFile(filepath, imageResponse.data);
        console.log(`✅ Image saved: ${filename}`);
        return { sceneId, filename, filepath, prompt, url: imageUrl };
      } else {
        throw new Error('No image data received');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`❌ Error generating image for scene ${sceneId}:`, error.message);
      } else {
        console.error(`❌ Error generating image for scene ${sceneId}:`, error);
      }
      return null;
    }
  }

  async generateImagesFromScript(
    script: string,
    generalPrompt: string = '',
    useOpenAI: boolean = true
  ): Promise<ImageResult[]> {
    console.log('🚀 Starting script to image generation...');
    await this.init();
    const scenes = this.splitScriptIntoScenes(script);
    console.log(`📝 Processing ${scenes.length} scenes`);
    const results: ImageResult[] = [];
    for (const scene of scenes) {
      console.log(`\n--- Processing Scene ${scene.id} ---`);
      console.log(`Content preview: ${scene.content.substring(0, 100)}...`);
      const imagePrompt = this.generateImagePrompt(scene.content, generalPrompt);
      console.log(`🔤 Image prompt: ${imagePrompt.substring(0, 150)}...`);
      const result = useOpenAI
        ? await this.generateImageOpenAI(imagePrompt, scene.id)
        : await this.generateImageStabilityAI(imagePrompt, scene.id);
      if (result) {
        results.push(result);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log(`\n🎉 Generation complete! Created ${results.length} images`);
    await this.generateReport(results, script.length);
    return results;
  }

  async generateReport(results: ImageResult[], scriptLength: number): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      scriptLength,
      totalScenes: results.length,
      successfulGenerations: results.filter((r) => r !== null).length,
      images: results.map((r) => ({
        sceneId: r.sceneId,
        filename: r.filename,
        prompt: r.prompt.substring(0, 100) + '...',
      })),
    };
    const reportPath = path.join(this.outputDir, 'generation_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Report saved: generation_report.json`);
  }
}

export default ScriptImageGenerator;

// Usage example
if (require.main === module) {
  (async () => {
    const API_KEY =  process.env.OPENAI_API_KEY ?? '';
    const USE_OPENAI = true;
    const generator = new ScriptImageGenerator(API_KEY);
    const sampleScript = `
    Welcome to our explainer video about machine learning.
    Machine learning is a branch of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed.
    Think of it like teaching a child to recognize animals by showing them thousands of pictures.
    The computer analyzes patterns in data to make predictions about new information it hasn't seen before.
    There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning.
    In supervised learning, we provide the computer with examples that include both the input and the correct answer.
    Unsupervised learning works with data that doesn't have predetermined answers, helping the computer find hidden patterns.
    Reinforcement learning teaches the computer through trial and error, rewarding good decisions and penalizing bad ones.
    Today, machine learning powers everything from recommendation systems to self-driving cars.
    Understanding these concepts helps us appreciate how AI is transforming our daily lives.
    `;

      const generalPrompt = `
You are a visual generation assistant that creates educational illustrations based on individual script sentences. Each sentence describes a single moment or idea from an explainer video.

Your job is to turn each sentence into a crystal-clear prompt that can be used with an AI image model to generate a meaningful flat-style illustration.

These prompts must work for **any topic** — not just programming — and adapt to the content of the sentence provided.

---

🎨 STYLE RULES:
- Use flat, cartoon-style visuals with soft colors (light blue or white background)
- Layout must be clean, readable, and focused
- Avoid clutter, shadows, gradients, or infographic styling

🧩 LAYOUT LOGIC:
- If the sentence describes a **process**, show a left-to-right flow with arrows
- If the sentence involves **people, metaphors, or roles**, visualize them as characters or icons
- If the sentence is **conceptual**, use visual metaphors that match the idea (e.g., teamwork → gears working together)

🧑‍🎤 CHARACTER USAGE:
- Include Thanos from Marvel Comics in each scene as the narrator, explainer, or guide — pointing, standing, or gesturing near the concept.
- He should be depicted in his classic purple appearance with golden armor and Infinity Gauntlet.
- Show him in a teaching pose, using his cosmic power to demonstrate concepts.
- Label this character as: "Thanos" in the scene.

🔤 LABELING:
- Include clear, simple text labels on or near key icons or figures
- Labels should match terms mentioned in the sentence (e.g., "Student", "Task", "AI Model")
- Label the purple character consistently as "Thanos"
- Avoid long paragraphs — keep text in visuals short and educational

---

🎯 OUTPUT FORMAT:
When you receive a sentence, return only the image generation prompt that:
- Describes the scene visually
- Mentions layout and elements
- Includes Thanos as the guide character and labels if needed

DO NOT return explanation, context, or intro text. Return **only** the pure image prompt.

Example:

Input: "The brain processes information while you sleep."

Output: "Generate a flat-style educational illustration showing a sleeping person in bed with light blue surroundings. Above their head, show a semi-transparent brain with gears and thought bubbles labeled 'memory', 'problem solving', and 'creativity'. To the side, include Thanos in his golden armor and purple skin, wearing the Infinity Gauntlet, pointing at the brain with a teaching gesture. Use cosmic energy effects around Thanos. Use a left-to-right flow of light to show brain activity."

---

This system prompt can be used for science, psychology, education, tech, philosophy — any topic that needs clean, instructive visuals for explainer content.
`;
    try {
      const results = await generator.generateImagesFromScript(
        sampleScript,
        generalPrompt,
        USE_OPENAI
      );
      console.log('\n🏁 Final Results:');
      console.log(`✅ Successfully generated ${results.length} images`);
      console.log(`📁 Images saved in: ${generator.outputDir}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error in main process:', error.message);
      } else {
        console.error('❌ Error in main process:', error);
      }
    }
  })();
}

// Package.json dependencies needed:
/*
{
  "dependencies": {
    "axios": "^1.6.0",
    "form-data": "^4.0.0"
  }
}
*/