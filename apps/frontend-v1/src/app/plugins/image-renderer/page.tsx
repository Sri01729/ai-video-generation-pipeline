'use client';

import { useState } from "react";
import { ImageChat } from './components/image-chat';

export default function ImageRendererPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, style: string) => {
    setIsGenerating(true);
    setImageUrl(null);
    try {
      // 1. Submit job
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plugins/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      if (!response.ok) throw new Error('Failed to queue image job');
      const data = await response.json();

      // 2. Poll for result
      const poll = setInterval(async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video/job/${data.jobId}`);
        const result = await res.json();
        if (result.result?.imageReady) {
          // 3. Fetch image as blob
          const imgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plugins/image/result/${data.jobId}`);
          const blob = await imgRes.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          setIsGenerating(false);
          clearInterval(poll);
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(poll);
        setIsGenerating(false);
      }, 120000);
    } catch (err) {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <ImageChat onGenerate={handleGenerate} imageUrl={imageUrl} isGenerating={isGenerating} />
    </>
  );
}