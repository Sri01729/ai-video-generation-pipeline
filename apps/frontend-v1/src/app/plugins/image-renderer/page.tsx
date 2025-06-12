'use client';

import { ImageChat } from './components/image-chat';

export default function ImageRendererPage() {
  const handleGenerate = async (prompt: string, style: string) => {
    // Implement image generation logic
    console.log('Generating image for:', prompt, 'with style:', style);
  };

  return <ImageChat onGenerate={handleGenerate} />;
}