"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Monitor,
  ChevronDown,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface VideoDimension {
  id: string
  name: string
  width: number
  height: number
  aspectRatio: number
  category: "Standard" | "HD" | "Ultra HD" | "Mobile"
  description: string
  shortName: string
}

export const VIDEO_DIMENSIONS: VideoDimension[] = [
  {
    id: "hd",
    name: "HD",
    width: 1280,
    height: 720,
    aspectRatio: 16 / 9,
    category: "HD",
    description: "1280 × 720",
    shortName: "HD",
  },
  {
    id: "fullhd",
    name: "Full HD",
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
    category: "HD",
    description: "1920 × 1080",
    shortName: "FHD",
  },
  {
    id: "2k",
    name: "2K",
    width: 2560,
    height: 1440,
    aspectRatio: 16 / 9,
    category: "Ultra HD",
    description: "2560 × 1440",
    shortName: "2K",
  },
  {
    id: "4k",
    name: "4K UHD",
    width: 3840,
    height: 2160,
    aspectRatio: 16 / 9,
    category: "Ultra HD",
    description: "3840 × 2160",
    shortName: "4K",
  },
  {
    id: "pal-dvd",
    name: "PAL DVD",
    width: 720,
    height: 576,
    aspectRatio: 5 / 4,
    category: "Standard",
    description: "720 × 576",
    shortName: "PAL",
  },
  {
    id: "ntsc-dvd",
    name: "NTSC DVD",
    width: 720,
    height: 480,
    aspectRatio: 3 / 2,
    category: "Standard",
    description: "720 × 480",
    shortName: "NTSC",
  },
  {
    id: "vertical",
    name: "Vertical Video",
    width: 1080,
    height: 1920,
    aspectRatio: 9 / 16,
    category: "Mobile",
    description: "1080 × 1920",
    shortName: "",
  },
]

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  defaultDimension?: string
}

export default function VideoPlayer({ src, poster, className, defaultDimension = "fullhd" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const dimensionDropdownRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [showDimensionDropdown, setShowDimensionDropdown] = useState(false)
  const [selectedDimension, setSelectedDimension] = useState<VideoDimension>(
    VIDEO_DIMENSIONS.find((d) => d.id === defaultDimension) || VIDEO_DIMENSIONS[1],
  )
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if current dimension is mobile (vertical)
  const isMobileDimension = selectedDimension.aspectRatio < 1

  // Calculate responsive dimensions
  const getResponsiveDimensions = () => {
    const maxWidth =
      typeof window !== "undefined"
        ? Math.min(window.innerWidth - 32, selectedDimension.width)
        : selectedDimension.width
    const maxHeight =
      typeof window !== "undefined"
        ? Math.min(window.innerHeight - 200, selectedDimension.height)
        : selectedDimension.height

    // Calculate dimensions maintaining aspect ratio
    let width = selectedDimension.width
    let height = selectedDimension.height

    if (width > maxWidth) {
      width = maxWidth
      height = width / selectedDimension.aspectRatio
    }

    if (height > maxHeight) {
      height = maxHeight
      width = height * selectedDimension.aspectRatio
    }

    return { width: Math.round(width), height: Math.round(height) }
  }

  const [responsiveDimensions, setResponsiveDimensions] = useState(getResponsiveDimensions())

  // Group dimensions by category
  const groupedDimensions = VIDEO_DIMENSIONS.reduce(
    (acc, dimension) => {
      if (!acc[dimension.category]) {
        acc[dimension.category] = []
      }
      acc[dimension.category].push(dimension)
      return acc
    },
    {} as Record<string, VideoDimension[]>,
  )

  // Update responsive dimensions on window resize or dimension change
  useEffect(() => {
    const updateDimensions = () => {
      setResponsiveDimensions(getResponsiveDimensions())
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [selectedDimension])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dimensionDropdownRef.current && !dimensionDropdownRef.current.contains(event.target as Node)) {
        setShowDimensionDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle video metadata loaded
  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      if (isFinite(videoDuration) && videoDuration > 0) {
        setDuration(videoDuration)
        setIsMetadataLoaded(true)
      }
    }
  }

  // Format countdown time in -MM:SS format
  const formatCountdownTime = (remainingTimeInSeconds: number) => {
    if (!isFinite(remainingTimeInSeconds)) return "-00:00"

    const minutes = Math.floor(remainingTimeInSeconds / 60)
    const seconds = Math.floor(remainingTimeInSeconds % 60)
    return `-${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Calculate remaining time
  const getRemainingTime = () => {
    return Math.max(0, duration - currentTime)
  }

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error)
        })
      }
    }
  }

  // Update play state based on video events
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    videoElement.addEventListener("play", handlePlay)
    videoElement.addEventListener("pause", handlePause)
    videoElement.addEventListener("ended", handleEnded)

    return () => {
      videoElement.removeEventListener("play", handlePlay)
      videoElement.removeEventListener("pause", handlePause)
      videoElement.removeEventListener("ended", handleEnded)
    }
  }, [])

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  // Handle seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (progressRef.current && videoRef.current && duration > 0 && isFinite(duration)) {
      const progressRect = progressRef.current.getBoundingClientRect()
      const clickX = e.clientX - progressRect.left
      const progressWidth = progressRect.width

      // Ensure we have valid dimensions
      if (progressWidth > 0) {
        const seekPosition = Math.max(0, Math.min(1, clickX / progressWidth))
        const seekTime = seekPosition * duration

        // Ensure seekTime is within valid range
        const validSeekTime = Math.max(0, Math.min(seekTime, duration))

        try {
          videoRef.current.currentTime = validSeekTime
          setCurrentTime(validSeekTime)
        } catch (error) {
          console.warn("Error seeking video:", error)
        }
      }
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const videoContainer = document.querySelector(".video-container") as HTMLDivElement
    if (!videoContainer) return

    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`)
        })
      }
    }
  }

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (videoRef.current && duration > 0) {
      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // Handle dimension change
  const handleDimensionChange = (dimension: VideoDimension) => {
    setSelectedDimension(dimension)
    setShowDimensionDropdown(false)
  }

  // Update progress bar
  useEffect(() => {
    const updateProgress = () => {
      if (videoRef.current) {
        const currentVideoTime = videoRef.current.currentTime
        const videoDuration = videoRef.current.duration

        if (isFinite(currentVideoTime) && currentVideoTime >= 0) {
          setCurrentTime(currentVideoTime)
        }

        // Update duration if it has changed or wasn't set properly
        if (isFinite(videoDuration) && videoDuration > 0 && videoDuration !== duration) {
          setDuration(videoDuration)
          setIsMetadataLoaded(true)
        }
      }
    }

    const videoElement = videoRef.current
    if (videoElement) {
      videoElement.addEventListener("timeupdate", updateProgress)
      videoElement.addEventListener("loadedmetadata", handleMetadataLoaded)
      videoElement.addEventListener("durationchange", handleMetadataLoaded)

      // Buffering detection
      videoElement.addEventListener("waiting", () => setIsBuffering(true))
      videoElement.addEventListener("playing", () => setIsBuffering(false))
      videoElement.addEventListener("canplay", () => setIsBuffering(false))
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("timeupdate", updateProgress)
        videoElement.removeEventListener("loadedmetadata", handleMetadataLoaded)
        videoElement.removeEventListener("durationchange", handleMetadataLoaded)
        videoElement.removeEventListener("waiting", () => setIsBuffering(true))
        videoElement.removeEventListener("playing", () => setIsBuffering(false))
        videoElement.removeEventListener("canplay", () => setIsBuffering(false))
      }
    }
  }, [])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Auto-hide controls
  useEffect(() => {
    const hideControls = () => {
      if (isPlaying && !showDimensionDropdown) {
        setShowControls(false)
      }
    }

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    if (isPlaying && !showDimensionDropdown) {
      controlsTimeoutRef.current = setTimeout(hideControls, 3000)
    } else {
      setShowControls(true)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying, currentTime, showDimensionDropdown])

  // Handle mouse movement to show controls
  const handleMouseMove = () => {
    setShowControls(true)

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    if (isPlaying && !showDimensionDropdown) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  // Calculate progress percentage safely
  const getProgressPercentage = () => {
    if (!isFinite(duration) || duration <= 0 || !isFinite(currentTime)) {
      return 0
    }

    const percentage = Math.max(0, Math.min(100, (currentTime / duration) * 100))
    return isFinite(percentage) ? percentage : 0
  }

  return (
    <div className="flex justify-center">
      <div
        className={cn("video-container relative group bg-black rounded-lg overflow-hidden bg-border-background border-1 shadow-2xl", className)}
        style={{
          width: `${responsiveDimensions.width}px`,
          height: `${responsiveDimensions.height}px`,
          maxWidth: "100vw",
          maxHeight: "80vh",
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          preload="metadata"
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
            <button
              onClick={togglePlay}
              className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex items-center justify-center rounded-full bg-foreground bg-opacity-20 backdrop-blur-sm transition-transform hover:scale-110"
            >
              <Play className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-black fill-foreground" />
            </button>
          </div>
        )}

        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-20">
            <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Controls */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-2 sm:px-3 lg:px-4 py-2 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0",
          )}
        >
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="w-full h-1 bg-white bg-opacity-30 rounded-full mb-2 sm:mb-3 lg:mb-4 cursor-pointer relative"
            onClick={handleSeek}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div
              className="h-full bg-white rounded-full relative transition-all duration-150 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full transform -translate-x-1/2 shadow-sm"></div>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              {/* Play/Pause Button */}
              <button onClick={togglePlay} className="text-white hover:text-gray-300 transition p-1">
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                )}
              </button>

              {/* Skip Buttons - Hidden on very small screens and mobile dimensions */}
              {!isMobileDimension && (
                <>
                  <button
                    onClick={() => skip(-10)}
                    className="text-white hover:text-gray-300 transition p-1 hidden sm:block"
                  >
                    <SkipBack className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>

                  <button
                    onClick={() => skip(10)}
                    className="text-white hover:text-gray-300 transition p-1 hidden sm:block"
                  >
                    <SkipForward className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                </>
              )}

              {/* Volume Control - Hidden for mobile dimensions */}
              {!isMobileDimension && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button onClick={toggleMute} className="text-white hover:text-gray-300 transition p-1">
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-12 sm:w-16 lg:w-24 accent-white hidden sm:block"
                  />
                </div>
              )}

              {/* Volume Control for Mobile Dimensions - Only mute button */}
              {isMobileDimension && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button onClick={toggleMute} className="text-white hover:text-gray-300 transition p-1">
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-12 sm:w-8 lg:w-12 accent-white hidden sm:block"
                  />
                </div>
              )}

              {/* Countdown Timer - Always visible when duration is available */}
              {!isMobileDimension && isMetadataLoaded && duration > 0 && (
                <div className="text-white text-xs sm:text-sm font-mono font-medium drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  {formatCountdownTime(getRemainingTime())}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              {/* Dimension Selector - Always visible */}
              <div className="relative" ref={dimensionDropdownRef}>
                <button
                  onClick={() => setShowDimensionDropdown(!showDimensionDropdown)}
                  className="flex items-center space-x-1 text-white hover:text-gray-300 transition p-1"
                  title="Video Dimensions"
                >
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs hidden sm:inline lg:inline">{selectedDimension.shortName}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", showDimensionDropdown && "rotate-180")} />
                </button>

                {/* Dimension Dropdown */}
                {showDimensionDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-95 backdrop-blur-sm border border-white border-opacity-20 rounded-lg shadow-2xl z-50 min-w-[80px] sm:min-w-[100px] max-h-80 overflow-y-auto">
                    {Object.entries(groupedDimensions).map(([category, categoryDimensions]) => (
                      <div key={category} className="p-1">
                        {/* Category Header */}
                        <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white border-opacity-10 mb-1">
                          {category}
                        </div>

                        {/* Category Items */}
                        {categoryDimensions.map((dimension) => (
                          <button
                            key={dimension.id}
                            onClick={() => handleDimensionChange(dimension)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-md transition-colors",
                              selectedDimension.id === dimension.id
                                ? "bg-white bg-opacity-20 text-white"
                                : "text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white",
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">{dimension.name}</span>
                              <span className="text-xs text-gray-400">{dimension.description}</span>
                            </div>
                            {selectedDimension.id === dimension.id && <Check className="w-3 h-3 text-white" />}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings Button - Always visible */}
              {!isMobileDimension && (
                <button title="Settings" className="text-white hover:text-gray-300 transition p-1 hidden sm:block">
                  <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              )}

              {/* Fullscreen Button - Always visible */}
              {!isMobileDimension && (
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-gray-300 transition p-1"
                  title="Fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
