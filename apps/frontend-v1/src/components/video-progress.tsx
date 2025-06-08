"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FileText, Mic, ImageIcon, Video, Settings, CheckCircle, Loader2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  duration?: number
}

export const steps: Step[] = [
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
    icon: ImageIcon,
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
}

export default function VideoProgress({ isActive = false, onComplete, className, currentStep: externalStep }: VideoProgressProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (typeof externalStep === "number") setCurrentStep(externalStep)
  }, [externalStep])

  useEffect(() => {
    if (!isActive || isCompleted) return

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
  }, [isActive, currentStep, isCompleted, onComplete])

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return "completed"
    if (stepIndex === currentStep && !isCompleted) return "active"
    if (stepIndex === currentStep && isCompleted) return "completed"
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
        <h2 className="text-3xl font-light text-black mb-3">{isCompleted ? "Video Ready" : "Generating Your Video"}</h2>
        <p className="text-gray-600 font-light">
          {isCompleted
            ? "Your AI-generated video has been successfully created"
            : "Please wait while we process your request"}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-8 left-0 w-full h-px bg-gray-200">
          <div
            className="h-full bg-black transition-all duration-700 ease-out"
            style={{
              width: `${((currentStep + (isCompleted ? 1 : progress / 100)) / steps.length) * 100}%`,
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
                      "bg-black border-black text-white": status === "completed",
                      "bg-white border-black text-black animate-pulse": status === "active",
                      "bg-white border-gray-300 text-gray-400": status === "pending",
                    },
                  )}
                >
                  {status === "completed" ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : status === "active" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}

                  {/* Active Step Progress Ring */}
                  {status === "active" && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="30"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray={`${(progress / 100) * 188.5} 188.5`}
                        className="text-black transition-all duration-300"
                      />
                    </svg>
                  )}
                </div>

                {/* Step Info */}
                <div className="mt-6 text-center max-w-32">
                  <h3
                    className={cn("font-medium text-sm transition-colors duration-300", {
                      "text-black": status === "completed" || status === "active",
                      "text-gray-400": status === "pending",
                    })}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn("text-xs mt-2 font-light transition-colors duration-300", {
                      "text-gray-600": status === "completed" || status === "active",
                      "text-gray-400": status === "pending",
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
      {!isCompleted && isActive && (
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 border border-gray-200 rounded-full bg-white">
            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
            <span className="text-sm font-light text-black">{steps[currentStep]?.description}</span>
          </div>
        </div>
      )}

      {/* Completion State - Streamlined */}
      {isCompleted && (
        <div className="mt-16 text-center space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-light text-black">Generation Complete</h3>
            <p className="text-gray-600 font-light max-w-md mx-auto">
              Your video has been successfully generated and is ready for viewing
            </p>
          </div>

          <div className="flex gap-4 justify-center items-center">
            <button
              onClick={resetProgress}
              className="px-6 py-3 text-sm font-light text-gray-700 bg-white border border-gray-300 hover:border-black transition-colors duration-200"
            >
              Generate Another
            </button>
            <button className="inline-flex items-center gap-3 px-8 py-3 text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors duration-200">
              <Play className="w-4 h-4" />
              Play Video
            </button>
          </div>
        </div>
      )}

      {/* Demo Controls */}
      {!isActive && !isCompleted && (
        <div className="mt-12 text-center">
          <button
            onClick={() => {
              resetProgress()
              // This would normally be triggered by your actual video generation process
            }}
            className="px-8 py-4 text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors duration-200"
          >
            Start Demo
          </button>
        </div>
      )}
    </div>
  )
}
