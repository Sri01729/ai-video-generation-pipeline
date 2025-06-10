"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FileText, Mic, Image, Video, Settings, CheckCircle, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Step {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  duration?: number
}

const steps: Step[] = [
  {
    id: "script",
    title: "Script Generation",
    description: "Creating video script from your prompt",
    icon: FileText,
    duration: 3000,
  },
  {
    id: "voiceover",
    title: "Voiceover Generation",
    description: "Converting script to speech",
    icon: Mic,
    duration: 5000,
  },
  {
    id: "images",
    title: "Image Generation",
    description: "Creating visuals for each scene",
    icon: Image,
    duration: 8000,
  },
  {
    id: "assembly",
    title: "Video Assembly",
    description: "Combining audio and visuals",
    icon: Video,
    duration: 4000,
  },
  {
    id: "processing",
    title: "Post-processing",
    description: "Optimizing and finalizing video",
    icon: Settings,
    duration: 3000,
  },
]

interface VideoProgressProps {
  isActive?: boolean
  onComplete?: () => void
  className?: string
  currentStep?: number
  progress?: number
  videoUrl?: string
  onWatchVideo?: () => void
}

export default function VideoProgress({
  isActive = false,
  onComplete,
  className,
  currentStep: externalCurrentStep,
  progress: externalProgress,
  videoUrl,
  onWatchVideo
}: VideoProgressProps & { videoUrl?: string, onWatchVideo?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [progress, setProgress] = useState(0)

  // Use external step and progress if provided (for WebSocket integration)
  const activeCurrentStep = externalCurrentStep !== undefined ? externalCurrentStep : currentStep
  const activeProgress = externalProgress !== undefined ? externalProgress : progress
  const activeIsCompleted = externalCurrentStep !== undefined ? externalCurrentStep >= steps.length : isCompleted

  useEffect(() => {
    if (!isActive || activeIsCompleted || externalCurrentStep !== undefined) return

    const currentStepData = steps[currentStep]
    if (!currentStepData) return

    // Simulate step progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1)
            return 0
          } else {
            setIsCompleted(true)
            onComplete?.()
            return 100
          }
        }
        return prev + 100 / (currentStepData.duration! / 100)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isActive, currentStep, isCompleted, onComplete, externalCurrentStep, activeIsCompleted])

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < activeCurrentStep) return "completed"
    if (stepIndex === activeCurrentStep && !activeIsCompleted) return "active"
    if (stepIndex === activeCurrentStep && activeIsCompleted) return "completed"
    if (activeIsCompleted) return "completed"
    return "pending"
  }

  const resetProgress = () => {
    setCurrentStep(0)
    setIsCompleted(false)
    setProgress(0)
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto p-6", className)}>
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-light text-foreground mb-3">
          {activeIsCompleted ? "Video Ready" : "Generating Your Video"}
        </h2>
        <p className="text-muted-foreground font-light">
          {activeIsCompleted
            ? "Your AI-generated video has been successfully created"
            : "Please wait while we process your request"}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-8 left-0 w-full h-px bg-muted">
          <div
            className="h-full bg-foreground transition-all duration-700 ease-out"
            style={{
              width: `${((activeCurrentStep + (activeIsCompleted ? 1 : activeProgress / 100)) / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index)
            const Icon = step.icon

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    "relative w-16 h-16 rounded-full border transition-all duration-500 flex items-center justify-center",
                    {
                      "bg-foreground border-foreground text-background": status === "completed",
                      "bg-background border-foreground text-foreground": status === "active",
                      "bg-muted border-border text-muted-foreground": status === "pending",
                    },
                  )}
                >
                  {status === "completed" ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}

                  {/* Active Step Progress Ring */}
                  {status === "active" && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="30"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="188.5"
                        strokeDashoffset={188.5 - (activeProgress / 100) * 188.5}
                        className="text-foreground transition-all duration-500"
                        style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' }}
                      />
                    </svg>
                  )}
                </div>

                {/* Step Info */}
                <div className="mt-6 text-center max-w-32">
                  <h3
                    className={cn("font-medium text-sm transition-colors duration-300", {
                      "text-foreground": status === "completed" || status === "active",
                      "text-muted-foreground": status === "pending",
                    })}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn("text-xs mt-2 font-light transition-colors duration-300", {
                      "text-muted-foreground": status === "completed" || status === "active",
                      "text-muted-foreground/70": status === "pending",
                    })}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Step Details */}
      {!activeIsCompleted && isActive && (
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 border border-muted rounded-full bg-background">
            <div className="w-2 h-2 bg-foreground rounded-full animate-pulse" />
            <span className="text-sm font-light text-foreground">{steps[activeCurrentStep]?.description}</span>
          </div>
        </div>
      )}

      {/* Completion State - Ultra Streamlined */}
      {activeIsCompleted && (
        <div className="mt-20 text-center space-y-8">
          {/* Simple completion indicator */}
          <div className="space-y-6">
            <div className="w-20 h-20 bg-foreground rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-background" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-light text-foreground">Your Video is Ready</h3>
              <p className="text-muted-foreground font-light">Generation completed successfully</p>
            </div>
          </div>

          {/* Clean action buttons */}
          <div className="flex gap-6 justify-center items-center pt-4">
            <button
              onClick={resetProgress}
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors duration-200 underline underline-offset-4"
            >
              Generate Another
            </button>
            {videoUrl && (
              <button className="inline-flex items-center gap-3 px-10 py-4 text-base font-medium text-background bg-foreground hover:bg-foreground/80 transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={onWatchVideo}
              >
                <Play className="w-5 h-5" />
                Watch Video
              </button>
            )}
          </div>
        </div>
      )}

      {/* Demo Controls */}
      {!isActive && !activeIsCompleted && (
        <div className="mt-12 text-center">
          <button
            onClick={() => {
              resetProgress()
              // This would normally be triggered by your actual video generation process
            }}
            className="px-8 py-4 text-sm font-medium text-background bg-foreground hover:bg-foreground/80 transition-colors duration-200"
          >
            Start Demo
          </button>
        </div>
      )}
    </div>
  )
}

export function VideoProgressWithWS({
  jobId,
  prompt,
  onComplete
}: {
  jobId: string
  prompt: string
  onComplete: (url: string) => void
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const router = useRouter();

  // Map backend progress messages to step indices and progress
  const mapProgressToStep = (progressPercent: number) => {
    // More precise mapping with better step transitions
    if (progressPercent <= 20) {
      return { stepIndex: 0, stepProgress: Math.min((progressPercent / 20) * 100, 100) }
    } else if (progressPercent <= 40) {
      return { stepIndex: 1, stepProgress: Math.min(((progressPercent - 20) / 20) * 100, 100) }
    } else if (progressPercent <= 80) {
      return { stepIndex: 2, stepProgress: Math.min(((progressPercent - 40) / 40) * 100, 100) }
    } else if (progressPercent <= 95) {
      return { stepIndex: 3, stepProgress: Math.min(((progressPercent - 80) / 15) * 100, 100) }
    } else {
      return { stepIndex: 4, stepProgress: Math.min(((progressPercent - 95) / 5) * 100, 100) }
    }
  }

  // Parse progress from various message formats
  const parseProgress = (data: any): number | null => {
    // Handle numeric progress directly
    if (typeof data.progress === 'number') {
      return data.progress
    }

    // Handle step field with percentage
    if (typeof data.step === 'string') {
      const percentMatch = data.step.match(/(\d+)%/)
      if (percentMatch) {
        return parseInt(percentMatch[1])
      }

      // Handle named steps - map them to approximate percentages
      const stepName = data.step.toLowerCase()
      if (stepName.includes('script')) return 10
      if (stepName.includes('voice') || stepName.includes('audio')) return 30
      if (stepName.includes('image') || stepName.includes('visual')) return 60
      if (stepName.includes('assembly') || stepName.includes('video')) return 85
      if (stepName.includes('processing') || stepName.includes('finalizing')) return 97
    }

    // Handle message field
    if (typeof data.message === 'string') {
      const percentMatch = data.message.match(/(\d+)%/)
      if (percentMatch) {
        return parseInt(percentMatch[1])
      }
    }

    return null
  }

  // Polling fallback function
  const pollJobStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video/job/${jobId}`)
      if (!response.ok) return

      const data = await response.json()
      console.log('[VideoProgressWithWS] Polling job status:', data)

      if (data.completed || data.state === 'completed') {
        handleJobCompletion()
        return true // Stop polling
      }

      const progressPercent = parseProgress(data)
      if (progressPercent !== null) {
        updateProgress(progressPercent)
      }

      return false // Continue polling
    } catch (error) {
      console.error('[VideoProgressWithWS] Polling error:', error)
      return false
    }
  }

  const updateProgress = (progressPercent: number) => {
    const { stepIndex, stepProgress } = mapProgressToStep(progressPercent)
    console.log(`[VideoProgressWithWS] Progress: ${progressPercent}% -> Step ${stepIndex}, Progress ${stepProgress.toFixed(1)}%`)

    setCurrentStep(stepIndex)
    setProgress(stepProgress)
    setError(null) // Clear any previous errors
  }

  const handleJobCompletion = async () => {
    console.log('[VideoProgressWithWS] Job completed')
    setCurrentStep(steps.length) // Set beyond last step to trigger completion
    setProgress(100)
    setIsCompleted(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video/result/${jobId}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setVideoUrl(url)
        // Do not auto-route, let user click Watch Video
      } else {
        throw new Error(`Failed to fetch result: ${res.status}`)
      }
    } catch (error) {
      console.error('[VideoProgressWithWS] Error fetching result:', error)
      setError('Failed to load video result')
    }

    setActive(false)
  }

  useEffect(() => {
    if (!jobId) return

    let ws: WebSocket | null = null
    let pollInterval: NodeJS.Timeout | null = null
    let wsConnected = false

    // 1. First, fetch current job status
    const initializeProgress = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/video/job/${jobId}`)
        if (response.ok) {
          const data = await response.json()
          console.log('[VideoProgressWithWS] Initial job status:', data)

          if (data.completed || data.state === 'completed') {
            handleJobCompletion()
            return
          }

          const progressPercent = parseProgress(data)
          if (progressPercent !== null) {
            updateProgress(progressPercent)
          }
        }
      } catch (error) {
        console.error('[VideoProgressWithWS] Error fetching initial job status:', error)
        setError('Failed to load job status')
      }
    }

    // 2. Set up WebSocket connection
    const setupWebSocket = () => {
      try {
        ws = new WebSocket("ws://localhost:4050")

        ws.onopen = () => {
          console.log('[VideoProgressWithWS] WebSocket connected')
          wsConnected = true
          ws?.send(JSON.stringify({ type: "subscribe", jobId }))

          // Clear polling interval if WebSocket connects
          if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = null
          }
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('[VideoProgressWithWS] WebSocket message:', data)

            if (data.step === "done" || data.completed || data.state === 'completed') {
              handleJobCompletion()
            } else {
              const progressPercent = parseProgress(data)
              if (progressPercent !== null) {
                updateProgress(progressPercent)
              }
            }
          } catch (error) {
            console.error('[VideoProgressWithWS] Error parsing WebSocket message:', error)
          }
        }

        ws.onerror = (error) => {
          console.error('[VideoProgressWithWS] WebSocket error:', error)
          wsConnected = false
          startPolling()
        }

        ws.onclose = () => {
          console.log('[VideoProgressWithWS] WebSocket closed')
          wsConnected = false
          if (!isCompleted) {
            startPolling()
          }
        }
      } catch (error) {
        console.error('[VideoProgressWithWS] Error setting up WebSocket:', error)
        startPolling()
      }
    }

    // 3. Polling fallback
    const startPolling = () => {
      if (pollInterval || isCompleted) return

      console.log('[VideoProgressWithWS] Starting polling fallback')
      pollInterval = setInterval(async () => {
        const shouldStop = await pollJobStatus()
        if (shouldStop && pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
      }, 2000) // Poll every 2 seconds
    }

    // Initialize everything
    initializeProgress().then(() => {
      // Try WebSocket first
      setupWebSocket()

      // Start polling as fallback after a delay
      setTimeout(() => {
        if (!wsConnected && !isCompleted) {
          startPolling()
        }
      }, 3000)
    })

    // Cleanup
    return () => {
      if (ws) {
        ws.close()
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [jobId, onComplete, isCompleted])

  // Always render the progress UI when active, regardless of updates
  if (!active && !isCompleted) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-3xl font-light text-foreground mb-3">Loading...</h2>
        <p className="text-muted-foreground font-light">Initializing video generation</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-3xl font-light text-red-500 mb-3">Error</h2>
        <p className="text-muted-foreground font-light">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-foreground text-background rounded hover:bg-foreground/80"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <VideoProgress
      isActive={active}
      currentStep={currentStep}
      progress={progress}
      videoUrl={videoUrl || undefined}
      onWatchVideo={videoUrl ? () => router.push(`/home/videoplayer?src=${encodeURIComponent(videoUrl)}`) : undefined}
      onComplete={() => {}}
    />
  )
}