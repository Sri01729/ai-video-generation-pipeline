"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { VideoProgressWithWS } from "@/components/video-progress"
import { Suspense } from "react"

function PipelineStatusContent() {
  const params = useSearchParams();
  const jobId = params.get("jobId");
  const prompt = params.get("prompt") || "";
  const router = useRouter();

  if (!jobId) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center bg-background">
        <div className="max-w-xl text-center p-8 rounded-lg border border-muted bg-background/80 shadow-sm">
          <h2 className="text-2xl font-light text-foreground mb-4">No video generation has been started</h2>
          <p className="text-muted-foreground font-light mb-8">
            Go to the dashboard to generate a video.
          </p>
          <button
            onClick={() => router.push("/home/dashboard")}
            className="px-8 py-3 text-base font-medium text-background bg-foreground rounded-full hover:bg-foreground/80 transition-colors duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoProgressWithWS
      jobId={jobId}
      prompt={prompt}
      onComplete={url => {
        router.push(`/home/videoplayer?src=${encodeURIComponent(url)}&prompt=${encodeURIComponent(prompt)}`);
      }}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-3xl font-light text-foreground mb-3">Loading...</h2>
        <p className="text-muted-foreground font-light">Preparing video generation</p>
      </div>
    }>
      <PipelineStatusContent />
    </Suspense>
  );
}