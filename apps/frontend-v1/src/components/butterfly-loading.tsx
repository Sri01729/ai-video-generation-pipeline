"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface ButterflyProps {
  id: number
  delay: number
  duration: number
  containerWidth: number
  containerHeight: number
  size: number
}

const ButterflyWing = ({ isLeft = true, colorClass = "text-primary dark:text-secondary" }: { isLeft?: boolean, colorClass?: string }) => (
  <div className={`wing ${isLeft ? "wing-left" : "wing-right"} ${colorClass}`}>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 17 29"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className={colorClass}
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
        strokeLinejoin: "round",
        strokeMiterlimit: 2,
        transform: isLeft ? "none" : "scaleX(-1)",
      }}
    >
      <g transform="matrix(0.0156264,0,0,0.0156264,-5.01358,-5.8732)">
        <path
          d="M1440.74,1614.9C1440.74,1494.13 1440.61,1185.89 1440.61,1065.11C1359.94,917.774 1154.27,576.526 933.987,480.781C758.042,404.081 442.781,320.927 347.826,423.951C309.909,465.096 311.95,525.578 353.949,603.894C495.736,868.494 562.977,1033.61 559.433,1109.67C559.631,1165.3 582.03,1218.62 621.625,1257.7C672.094,1308.02 737.686,1340.44 808.312,1349.98C720.107,1405.47 666.305,1502.53 665.987,1606.74C667.922,1738.19 698.611,1867.63 755.892,1985.96C802.959,2114.05 921.66,2202.78 1057.84,2211.67L1059.66,2211.67C1210.93,2193.6 1319.79,2057.62 1304.35,1906.04C1304.35,1701.95 1387.79,1632.12 1440.74,1614.9Z"
          fill="currentColor"
          fillRule="nonzero"
        />
      </g>
    </svg>
  </div>
)

const AnimatedButterfly = ({ id, delay, duration, containerWidth, containerHeight, size, colorClass }: ButterflyProps & { colorClass: string }) => {
  const [path, setPath] = useState<{ x: number; y: number; rotate: number }[]>([])

  useEffect(() => {
    const generateRandomPath = () => {
      const points = []
      const numPoints = 6 + Math.floor(Math.random() * 4) // 6-10 points

      for (let i = 0; i < numPoints; i++) {
        points.push({
          x: Math.random() * (containerWidth - size),
          y: Math.random() * (containerHeight - size),
          rotate: (Math.random() - 0.5) * 60, // Random rotation between -30 and 30 degrees
        })
      }
      return points
    }

    setPath(generateRandomPath())
  }, [containerWidth, containerHeight, size])

  if (path.length === 0) return null

  // Different butterfly configurations based on ID
  const butterflyConfigs = [
    { scale: 1, wingDelay: 0, wingDuration: 0.5 },
    { scale: 0.7, wingDelay: 0.25, wingDuration: 0.3 },
    { scale: 0.5, wingDelay: 0.2, wingDuration: 0.25 },
    { scale: 0.8, wingDelay: 0.3, wingDuration: 0.35 },
    { scale: 1.1, wingDelay: 0.25, wingDuration: 0.4 },
  ]

  const config = butterflyConfigs[id % butterflyConfigs.length]

  return (
    <motion.div
      className="absolute"
      style={{ width: size, height: size }}
      initial={{
        x: path[0]?.x || 0,
        y: path[0]?.y || 0,
        opacity: 0,
        rotate: path[0]?.rotate || 0,
      }}
      animate={{
        x: path.map((p) => p.x),
        y: path.map((p) => p.y),
        rotate: path.map((p) => p.rotate),
        opacity: [0, 1, 1, 1, 0],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        times: [0, 0.1, 0.5, 0.9, 1],
      }}
    >
      <div
        className="bf flex relative"
        style={{
          width: `${size * config.scale}px`,
          height: "auto",
          transform: `scale(${config.scale})`,
        }}
      >
        <motion.div
          className="wing-left"
          style={{
            width: "50%",
            transformOrigin: "right",
          }}
          animate={{
            rotateY: [-60, 0, -60],
          }}
          transition={{
            duration: config.wingDuration,
            delay: config.wingDelay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <ButterflyWing isLeft={true} colorClass={colorClass} />
        </motion.div>

        <motion.div
          className="wing-right"
          style={{
            width: "50%",
            transformOrigin: "left",
          }}
          animate={{
            rotateY: [60, 0, 60],
          }}
          transition={{
            duration: config.wingDuration,
            delay: config.wingDelay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <ButterflyWing isLeft={false} colorClass={colorClass} />
        </motion.div>
      </div>
    </motion.div>
  )
}

interface ButterflyLoadingProps {
  /** Number of butterflies to display */
  count?: number
  /** Animation duration in seconds for flight path */
  duration?: number
  /** Container width */
  width?: number
  /** Container height */
  height?: number
  /** Size of each butterfly */
  butterflySize?: number
  /** Loading text to display */
  text?: string
  /** Additional CSS classes */
  className?: string
  /** Background color */
  backgroundColor?: string
  /** Color class for butterflies */
  colorClass?: string
}

export default function ButterflyLoading({
  count = 8,
  duration = 10,
  width = 500,
  height = 400,
  butterflySize = 24,
  text = "Loading...",
  className = "",
  backgroundColor = "from-gray-50 to-white",
  colorClass = "text-primary dark:text-secondary",
}: ButterflyLoadingProps & { colorClass?: string }) {
  const butterflies = Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: (i * duration) / count + Math.random() * 2,
    duration: duration + Math.random() * 4, // Variation in flight duration
    size: butterflySize + Math.random() * 8, // Size variation
  }))

  return (
    <div className={`flex flex-col border bg-card items-center justify-center space-y-6 ${className}`}>
      <div
        className="relative overflow-hidden rounded-lg bg-card"
        style={{ width, height }}
      >
        {butterflies.map((butterfly) => (
          <AnimatedButterfly
            key={butterfly.id}
            id={butterfly.id}
            delay={butterfly.delay}
            duration={butterfly.duration}
            containerWidth={width}
            containerHeight={height}
            size={butterfly.size}
            colorClass={colorClass}
          />
        ))}

        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 backdrop-blur-[0.5px] pointer-events-none" />
      </div>

      {text && (
        <motion.p
          className="text-gray-700 font-medium text-lg tracking-wide"
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [0.98, 1, 0.98],
          }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}
