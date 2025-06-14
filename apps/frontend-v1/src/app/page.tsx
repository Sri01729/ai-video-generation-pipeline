"use client";

import React, { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
// Dynamically import PixelatedImage to avoid SSR issues
const PixelatedImage = dynamic(
  () => import("@/components/ui/pixelated-image"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 w-full h-full bg-gray-200 animate-pulse" />
    )
  }
);

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/home/dashboard");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="relative w-screen h-screen overflow-hidden">
        {/* Background Image Effect */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={
            <div className="absolute inset-0 w-full h-full bg-gray-200 animate-pulse" />
          }>
            <PixelatedImage
              src="/Maaya-pattern.png"
              alt="Maaya homepage image"
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              grid={15}
              mouse={0.13}
              strength={0.15}
              relaxation={0.9}
            />
          </Suspense>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center z-10 px-6 pointer-events-none">
          <h1 className="text-5xl md:text-7xl font-light mb-4 tracking-widest text-white mix-blend-exclusion drop-shadow-2xl">
            MAAYA
          </h1>
          <p className="text-sm md:text-base text-white/70 font-mono tracking-wide drop-shadow-lg absolute bottom-2/5">
            write • voice • animate
          </p>
        </div>
      </div>
    </main>
  );
}