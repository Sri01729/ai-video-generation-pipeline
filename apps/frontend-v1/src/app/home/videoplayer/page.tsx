"use client"

import AnimatedAIChat from "@/components/ui/animated-ai-chat"
import VideoPlayer from "@/components/video-player"



export default function Page() {
  return (
<div className="w-full max-w-7xl">
       
        <VideoPlayer
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          poster="/placeholder.svg?height=720&width=1280"
        />
      </div>
  )
}
