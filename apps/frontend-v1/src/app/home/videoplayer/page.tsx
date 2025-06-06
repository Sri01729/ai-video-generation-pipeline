"use client"
import VideoPlayer from "@/components/video-player"

export default function Page() {
  return (
      <div className="w-full max-w-7xl mx-auto p-4">

        <VideoPlayer
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          poster="/placeholder.svg?height=720&width=1280"
        />
      </div>
  )
}
