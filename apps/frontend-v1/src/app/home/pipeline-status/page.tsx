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
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-3xl font-light text-red-500 mb-3">Error</h2>
        <p className="text-muted-foreground font-light">No job ID provided</p>
        <button
          onClick={() => router.push("/home")}
          className="mt-4 px-6 py-2 bg-foreground text-background rounded hover:bg-foreground/80"
        >
          Go Back
        </button>
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