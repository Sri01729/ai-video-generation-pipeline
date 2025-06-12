'use client';

import { useState, useRef, useEffect } from "react";
import { VoiceChat } from './components/voice-chat';

export default function VoiceSynthesizerPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleGenerate = async (text: string, voice: string) => {
    setIsGenerating(true);
    setAudioUrl(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plugins/voice/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: text,
          voice,
          model: 'tts-1'
        }),
      });

      if (!response.ok) throw new Error('Failed to queue voice job');
      const data = await response.json();
      setJobId(data.jobId);

      // Poll for result
      const poll = setInterval(async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video/job/${data.jobId}`);
        const result = await res.json();
        if (result.result?.audioUrl) {
          setAudioUrl(result.result.audioUrl);
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
    <VoiceChat
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      audioUrl={audioUrl}
    />
  );
}