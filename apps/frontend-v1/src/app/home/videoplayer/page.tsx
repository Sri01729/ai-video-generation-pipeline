"use client"
import VideoPlayer from "@/components/video-player"
import { useSearchParams } from "next/navigation"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function Page() {
  const params = useSearchParams();
  const src = params.get("src") || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const prompt = params.get("prompt");
  return (
      <div className="w-full max-w-7xl mx-auto p-4">
        {prompt && (
          <div className="flex justify-center mb-4">
            <Accordion type="single" collapsible className="max-w-3xl w-full mx-auto">
              <AccordionItem value="prompt">
                <AccordionTrigger className="text-base font-semibold">Prompt</AccordionTrigger>
                <AccordionContent className="text-base px-4 py-2 bg-muted/70 rounded-b-lg border-t border-border">
                  {prompt}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
        <VideoPlayer
          src={src}
          poster="/placeholder.svg?height=720&width=1280"
        />
      </div>
  )
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};
