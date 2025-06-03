import React from 'react';

const steps = [
  { label: 'Script' },
  { label: 'Voice' },
  { label: 'Audio' },
  { label: 'Subtitles' },
  { label: 'Images' },
  { label: 'Video' },
];

const dummyProgress = [1, 1, 0.7, 0.3, 0, 0]; // 1 = done, 0 = not started, 0-1 = in progress
const dummyTime = ['Done', 'Done', '0:12', '0:34', 'Waiting', 'Waiting'];
const dummyQuality = ['A+', 'A', 'B+', 'B', '-', '-'];

export function PipelineSteps() {
  return (
    <div className="flex flex-col gap-2 mt-8">
      {/* Row 1: Circles and connecting bars */}
      <div className="flex items-center w-full">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex items-center justify-center min-w-[72px]">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${dummyProgress[i] === 1 ? 'border-success bg-success/10' : dummyProgress[i] > 0 ? 'border-warning bg-warning/10 animate-pulse' : 'border-neutral bg-background'}`}>
                {dummyProgress[i] === 1 ? <span className="w-7 h-7 text-success">✓</span> : dummyProgress[i] > 0 ? <span className="w-7 h-7 text-warning animate-spin">...</span> : null}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 relative min-w-[32px]">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral/20 rounded-full -translate-y-1/2" />
                <div
                  className={`absolute top-1/2 left-0 h-1 rounded-full -translate-y-1/2 transition-all duration-500
                    ${dummyProgress[i] === 1 ? 'bg-success' : dummyProgress[i] > 0 ? 'bg-warning animate-pulse' : 'bg-neutral/30'}`}
                  style={{ width: dummyProgress[i] === 1 ? '100%' : dummyProgress[i] > 0 ? `${dummyProgress[i] * 100}%` : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Row 2: Labels, progress bars, and time/quality */}
      <div className="flex items-center w-full mt-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex-1 min-w-0 flex flex-col items-center">
            <span className="text-xs font-label text-neutral">{step.label}</span>
            <div className="w-16 h-2 bg-neutral/20 rounded-full mt-2 overflow-hidden">
              <div className={`h-2 ${dummyProgress[i] === 1 ? 'bg-success' : dummyProgress[i] > 0 ? 'bg-warning animate-pulse' : 'bg-neutral/40'}`} style={{ width: `${dummyProgress[i] * 100}%` }} />
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className="text-neutral">{dummyTime[i]}</span>
              <span className="text-primary font-bold">{dummyQuality[i]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}