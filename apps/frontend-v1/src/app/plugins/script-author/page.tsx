'use client';

import { ScriptChat } from './components/script-chat';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from "sonner";


export default function ScriptAuthorPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plugins/script/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          persona: 'funny, sharp-tongued tech explainer',
          style: 'memes, sarcasm, relatable developer humor',
          maxLength: 700,
          model: 'gpt-4.1-nano',
          provider: 'openai',
          promptStyle: 'dev-meme'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate script');
      }

      const data = await response.json();

      if (data.jobId) {
        toast.success("Script generation started");

        // Poll for the result using the existing video job endpoint
        const pollInterval = setInterval(async () => {
          const resultResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video/job/${data.jobId}`);
          const resultData = await resultResponse.json();

          if (resultData.result?.script) {
            setGeneratedScript(resultData.result.script);
            clearInterval(pollInterval);
            toast.success("Script generated successfully");
            setIsGenerating(false);
          }
        }, 2000);

        // Clear interval after 2 minutes (timeout)
        setTimeout(() => {
          clearInterval(pollInterval);
          if (!generatedScript) {
            toast.error("Script generation timed out");
            setIsGenerating(false);
          }
        }, 120000);
      }
    } catch (error) {
      console.error('Script generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate script');
      setIsGenerating(false);
    }
  };

  return <ScriptChat onGenerate={handleGenerate} generatedScript={generatedScript} isGenerating={isGenerating} />;
}