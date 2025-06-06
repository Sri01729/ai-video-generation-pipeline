"use client"
import VideoPlayer from "@/components/video-player"
import { useSearchParams } from "next/navigation"

export default function Page() {
  const params = useSearchParams();
  const src = params.get("src") || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  return (
      <div className="w-full max-w-7xl mx-auto p-4">
        <VideoPlayer
          src={src}
          poster="/placeholder.svg?height=720&width=1280"
        />
      </div>
  )
}
