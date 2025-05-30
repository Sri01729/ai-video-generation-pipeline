import React, { useState, useEffect } from 'react';

const personas = [
  { label: 'Tech Guru', value: 'tech' },
  { label: 'Comedian', value: 'comedian' },
  { label: 'Professor', value: 'professor' },
  { label: 'Documentary narrator', value: 'doc' },
];
const styles = [
  { label: 'Memes', value: 'memes' },
  { label: 'Sarcasm', value: 'sarcasm' },
  { label: 'Artistic', value: 'artistic' },
  { label: 'Cinematic, Epic', value: 'cinematic' },
];

function analyzePrompt(prompt: string): {
  highlights: string;
  confidence: number;
  suggestion: string;
  smart: { persona?: string; style?: string };
  accent: string;
} {
  const words = prompt.split(/\s+/);
  const highlights = words.map(w => w.length > 6 ? `<span class='text-primary font-bold'>${w}</span>` : w).join(' ');
  const confidence = Math.min(1, prompt.length / 100);
  let suggestion = '';
  let smart: { persona?: string; style?: string } = {};
  let accent = '';
  if (prompt.toLowerCase().includes('mars')) {
    suggestion = 'Try style: "Cinematic, Epic" and persona: "Documentary narrator"';
    smart = { style: 'cinematic', persona: 'doc' };
    accent = 'blue';
  } else if (prompt.toLowerCase().includes('joke') || prompt.toLowerCase().includes('funny')) {
    suggestion = 'Try persona: "Comedian" and style: "Memes"';
    smart = { style: 'memes', persona: 'comedian' };
    accent = 'orange';
  } else if (prompt.toLowerCase().includes('explain') || prompt.toLowerCase().includes('learn')) {
    suggestion = 'Try persona: "Professor" and style: "Artistic"';
    smart = { style: 'artistic', persona: 'professor' };
    accent = 'green';
  }
  return { highlights, confidence, suggestion, smart, accent };
}

export function PromptSettings({ prompt, setPrompt, maxLength, setMaxLength, touched, setTouched, suggestion }:{
  prompt: string;
  setPrompt: (v: string) => void;
  maxLength: string;
  setMaxLength: (v: string) => void;
  touched: boolean;
  setTouched: (v: boolean) => void;
  suggestion: string;
}) {
  const promptError = touched && prompt.trim().length === 0;
  const maxLengthError = touched && (maxLength && Number(maxLength) <= 0);
  const promptSuccess = touched && prompt.trim().length > 0;
  return (
    <>
      <div className="relative">
        <textarea
          className={`w-full h-32 rounded-xl border bg-background p-3 font-body text-lg resize-none mb-2 transition-all duration-150
            ${promptError ? 'border-warning animate-shake' : 'border-neutral'}
            ${promptSuccess ? 'border-success focus:ring-2 focus:ring-success' : 'focus:ring-2 focus:ring-primary'}`}
          placeholder="Enter your video topic or question..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {promptSuccess && <span className="absolute top-2 right-2 text-success w-6 h-6 animate-fade-in" />}
        {promptError && <span className="absolute top-2 right-2 text-warning w-6 h-6 animate-shake">!</span>}
      </div>
      {suggestion && (
        <div className="flex items-center gap-2 mt-2 text-xs text-primary font-label animate-pulse">
          <span className="absolute top-2 right-2 text-primary w-6 h-6 animate-fade-in">*</span>
          <span>Suggestion: {suggestion}</span>
        </div>
      )}
      <label className="block font-label text-neutral mb-2">Max Length</label>
      <div className="relative">
        <input
          type="number"
          className={`w-full rounded-xl border bg-background p-2 font-body text-base transition-all duration-150
            ${maxLengthError ? 'border-warning animate-shake' : 'border-neutral'}
            ${!maxLengthError && maxLength ? 'border-success focus:ring-2 focus:ring-success' : 'focus:ring-2 focus:ring-primary'}`}
          placeholder="Character limit"
          value={maxLength}
          onChange={e => setMaxLength(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {!maxLengthError && maxLength && <span className="absolute top-2 right-2 text-success w-5 h-5 animate-fade-in" />}
        {maxLengthError && <span className="absolute top-2 right-2 text-warning w-5 h-5 animate-shake">!</span>}
      </div>
    </>
  );
}

export function PersonaStyleSettings({ persona, setPersona, style, setStyle }:{
  persona: string;
  setPersona: (v: string) => void;
  style: string;
  setStyle: (v: string) => void;
}) {
  return (
    <>
      <label className="block font-label text-neutral mb-2">Narrator Persona</label>
      <input
        className="w-full rounded-xl border bg-background p-2 font-body text-base mb-4"
        value={persona}
        onChange={e => setPersona(e.target.value)}
        placeholder="Enter persona (e.g. professor, comedian)"
      />
      <label className="block font-label text-neutral mb-2">Narration Style</label>
      <input
        className="w-full rounded-xl border bg-background p-2 font-body text-base mb-4"
        value={style}
        onChange={e => setStyle(e.target.value)}
        placeholder="Enter style (e.g. artistic, memes)"
      />
    </>
  );
}

// Tailwind custom animation utilities (add to globals.css or tailwind config):
// .animate-shake { animation: shake 0.3s; }
// @keyframes shake { 10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); } 30%, 50%, 70% { transform: translateX(-8px); } 40%, 60% { transform: translateX(8px); } }
// .animate-fade-in { animation: fadeIn 0.4s; }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }