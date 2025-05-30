import React, { useState } from 'react';
import { PipelineSteps } from '../workflow/PipelineSteps';
import { PreviewPanel } from '../workflow/PreviewPanel';

const creativePrompts = [
  'Imagine a world with flying cars...',
  'What if AI could paint like Van Gogh?',
  'A grand monolith standing over Mars...',
  'Describe a city powered by dreams...'
];

function AnimatedPlaceholder() {
  const [index, setIndex] = useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % creativePrompts.length), 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
      <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-tr from-gray-200 to-gray-400 animate-pulse" />
      <div className="text-lg text-gray-500 italic text-center transition-all duration-500 min-h-[2.5em]">
        {creativePrompts[index]}
      </div>
    </div>
  );
}

function PreviewGrid({ videoUrl }: { videoUrl: string | null }) {
  return (
    <div className="flex items-center justify-center w-full h-full flex-1">
      <div className="bg-gray-200 border border-black rounded-xl flex items-center justify-center aspect-[1024/1536] w-full h-full max-w-[400px] max-h-[600px] min-h-[200px]">
        {videoUrl ? (
          <video controls className="w-full h-full object-contain" src={videoUrl} />
        ) : (
          <span className="text-gray-400 text-2xl font-bold">Preview</span>
        )}
      </div>
    </div>
  );
}

function ZoomPanControls() {
  return (
    <div className="absolute top-4 right-4 flex gap-2 z-10">
      <button className="bg-white border border-black rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-gray-100">+</button>
      <button className="bg-white border border-black rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-gray-100">-</button>
      <button className="bg-white border border-black rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-gray-100">⤢</button>
    </div>
  );
}

function ParameterOverlay() {
  // Dummy summary for now
  return (
    <div className="absolute bottom-4 left-4 bg-white/80 border border-black rounded-lg px-4 py-2 text-sm text-black shadow">
      <span className="font-semibold">Prompt:</span> "A grand monolith standing over Mars..."<br />
      <span className="font-semibold">Style:</span> Memes, sarcasm<br />
      <span className="font-semibold">Persona:</span> Tech explainer
    </div>
  );
}

export function MainContent({ videoUrl }: { videoUrl: string | null }) {
  return (
    <>
      <div className="relative flex-1 flex flex-col items-center justify-center bg-[#0f172a] rounded-2xl shadow-panel p-8 overflow-hidden h-full min-h-screen">
        <div className="w-full h-full flex-1 flex">
          <PreviewGrid videoUrl={videoUrl} />
        </div>
      </div>
      {/* <PipelineSteps /> */}
    </>
  );
}