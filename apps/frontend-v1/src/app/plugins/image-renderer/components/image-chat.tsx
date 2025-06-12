'use client';

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, LoaderIcon, ImageIcon, Upload } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ImageChatProps {
  onGenerate: (prompt: string, style: string) => Promise<void>;
}

export function ImageChat({ onGenerate }: ImageChatProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const styles = [
    { id: "realistic", name: "Realistic" },
    { id: "cartoon", name: "Cartoon" },
    { id: "anime", name: "Anime" },
    { id: "painting", name: "Painting" },
  ];

  const handleGenerate = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      await onGenerate(value.trim(), selectedStyle);
    } catch (error) {
      console.error('Failed to generate image:', error);
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

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesText
              text="Image Renderer"
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
                placeholder="Describe the image you want to generate..."
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
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name}
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
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                Generate Image
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}