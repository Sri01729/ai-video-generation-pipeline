'use client';

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, LoaderIcon, Upload, FileAudio, Download } from "lucide-react";
import { SparklesText } from "@/components/ui/sparkles-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface TranscriberChatProps {
  onTranscribe: (file: File) => Promise<string>;
}

export function TranscriberChat({ onTranscribe }: TranscriberChatProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTranscript(""); // Clear previous transcript
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      const result = await onTranscribe(file);
      setTranscript(result);
      setProgress(100);
      clearInterval(progressInterval);
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.split('.')[0] || 'transcript'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesText
              text="Audio Transcriber"
              className="text-2xl font-medium"
              colors={{ first: "#000", second: "#fff" }}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center",
                  "hover:border-primary/50 transition-colors",
                  "cursor-pointer"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="audio/*"
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center gap-2 justify-center">
                    <FileAudio className="h-6 w-6" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      Click to upload audio file
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleTranscribe}
                disabled={loading || !file}
                className="w-full"
              >
                {loading ? (
                  <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileAudio className="h-4 w-4 mr-2" />
                )}
                Transcribe Audio
              </Button>
            </div>

            {/* Progress Bar */}
            {loading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Transcribing audio... {progress}%
                </p>
              </div>
            )}

            {/* Transcript Section */}
            {transcript && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Transcript</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
                <Textarea
                  value={transcript}
                  readOnly
                  className="min-h-[200px] resize-none"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}