'use client';

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, LoaderIcon, MicIcon, Upload } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import  ButterflyLoading  from "@/components/butterfly-loading";

interface VoiceChatProps {
  onGenerate: (text: string, voice: string) => Promise<void>;
  isGenerating: boolean;
  audioUrl: string | null;
}

export function VoiceChat({ onGenerate, isGenerating, audioUrl }: VoiceChatProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("sage");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const voices = [
    { id: "sage", name: "Sage" },
    { id: "nova", name: "Nova" },
    { id: "echo", name: "Echo" },
    { id: "fable", name: "Fable" },
  ];

  const handleGenerate = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      await onGenerate(value.trim(), selectedVoice);
    } catch (error) {
      console.error('Failed to generate voice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!value.trim()) return;
    setImproving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/improve-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value })
      });
      const data = await res.json();
      if (data.improved) setValue(data.improved);
    } catch (err) {
      console.error('Failed to improve prompt:', err);
    } finally {
      setImproving(false);
    }
  };

  useEffect(() => {
    if (responseRef.current) setContainerWidth(responseRef.current.offsetWidth);
    const handleResize = () => {
      if (responseRef.current) setContainerWidth(responseRef.current.offsetWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesText
              text="Voice Synthesizer"
              className="text-2xl font-medium"
              colors={{ first: "#000", second: "#fff" }}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter text to convert to speech..."
                className="min-h-[120px] resize-none"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={handleImprove}
                disabled={improving || !value.trim()}
              >
                {improving ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-4">
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerate}
                disabled={loading || !value.trim()}
                className="flex-1"
              >
                {loading ? (
                  <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MicIcon className="h-4 w-4 mr-2" />
                )}
                Generate Voice
              </Button>
            </div>
          </div>
          <div ref={responseRef}>
            {isGenerating && (
              <ButterflyLoading
                count={5}
                duration={8}
                width={containerWidth || 400}
                height={200}
                butterflySize={20}
                className="!border-0"
              />
            )}
          </div>
          {audioUrl && (
            <audio controls src={audioUrl} className="w-full mt-4" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}