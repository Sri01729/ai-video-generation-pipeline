'use client';

import { TranscriberChat } from './components/transcriber-chat';

export default function SubtitleTranscriberPage() {
  const handleTranscribe = async (file: File): Promise<string> => {
    // Create FormData
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      return data.transcript;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  };

  return <TranscriberChat onTranscribe={handleTranscribe} />;
}