'use client';

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, LoaderIcon, SendIcon } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ButterflyLoading from "@/components/butterfly-loading";

interface ScriptChatProps {
  onGenerate: (prompt: string) => Promise<void>;
  generatedScript: string;
  isGenerating: boolean;
}

export function ScriptChat({ onGenerate, generatedScript, isGenerating }: ScriptChatProps) {
  const [value, setValue] = useState("");
  const [improving, setImproving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (responseRef.current) {
      setContainerWidth(responseRef.current.offsetWidth);
    }
    // Optionally, add a resize listener for dynamic resizing
    const handleResize = () => {
      if (responseRef.current) {
        setContainerWidth(responseRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleGenerate = async () => {
    if (!value.trim()) return;
    try {
      await onGenerate(value.trim());
      toast.success("Script generated successfully!");
    } catch (error) {
      console.error('Failed to generate script:', error);
      toast.error("Failed to generate script.");
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

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-2xl mx-auto border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesText
              text="Script Author"
              className="text-2xl font-medium"
              colors={{ first: "hsl(var(--foreground))", second: "hsl(var(--primary))" }}
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
                placeholder="Describe your video idea or paste a script..."
                className="min-h-[120px] resize-none bg-background text-foreground"
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
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !value.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SendIcon className="h-4 w-4 mr-2" />
              )}
              Generate Script
            </Button>
            {(isGenerating || generatedScript) && (
              <div
                ref={responseRef}
                className="mt-4 p-4 rounded-lg border bg-card text-card-foreground min-h-[200px] w-full overflow-hidden"
                style={{ position: "relative" }}
              >
                {isGenerating ? (
                  <ButterflyLoading
                    count={5}
                    duration={8}
                    width={containerWidth || 400}
                    height={200}
                    butterflySize={20}
                    className="!border-0"
                  />
                ) : (
                  <div className="w-full">
                    <h3 className="font-bold mb-2">Generated Script:</h3>
                    <p className="whitespace-pre-wrap">{generatedScript}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}