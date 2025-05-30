import React, { useState, useEffect } from 'react';
import { PromptSettings, PersonaStyleSettings } from '../parameters/ScriptSettings';
import { AIProvider } from '../parameters/AIProvider';
import { OutputOptions } from '../parameters/OutputOptions';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  setVideoUrl: (url: string | null) => void;
}

const presets = [
  { label: 'Movie Trailer', preset: { prompt: 'A dramatic movie trailer for a sci-fi epic', persona: 'doc', style: 'cinematic' } },
  { label: 'Educational', preset: { prompt: 'Explain quantum physics to a 12-year-old', persona: 'professor', style: 'artistic' } },
  { label: 'Comedy Skit', preset: { prompt: 'A stand-up comedy bit about AI', persona: 'comedian', style: 'memes' } },
  { label: 'Game Review', preset: { prompt: 'Review the latest open-world RPG', persona: 'tech', style: 'sarcasm' } },
  { label: 'News Style', preset: { prompt: 'Breaking news: AI takes over the world', persona: 'doc', style: 'cinematic' } },
  { label: 'Art Analysis', preset: { prompt: 'Analyze Van Gogh\'s Starry Night', persona: 'professor', style: 'artistic' } },
];

function PresetsBar({ onPreset }: { onPreset: (preset: any) => void }) {
  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
      {presets.map(p => (
        <button
          key={p.label}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-neutral bg-background p-3 min-w-[110px] shadow hover:border-primary transition-all"
          onClick={() => onPreset(p.preset)}
          type="button"
        >
          <span className="mt-2 text-xs font-label text-neutral text-center whitespace-nowrap">{p.label}</span>
        </button>
      ))}
    </div>
  );
}

const Card = ({ title, completed, open, onToggle, badge, children }: { title: string, completed: boolean, open: boolean, onToggle: () => void, badge?: string, children: React.ReactNode }) => (
  <div className="mb-6 rounded-2xl border border-black shadow-panel bg-white">
    <button className="w-full flex items-center justify-between px-5 py-4 focus:outline-none" onClick={onToggle}>
      <div className="flex items-center gap-2">
        {completed ? <span className="text-green-500 w-5 h-5">✓</span> : <span className="text-gray-400 w-5 h-5">○</span>}
        <span className="font-semibold text-lg text-black">{title}</span>
        {badge && <span className="ml-2 px-2 py-0.5 rounded bg-neutral text-white text-xs font-medium uppercase tracking-wide">{badge}</span>}
      </div>
      <span className="w-5 h-5 text-black">▼</span>
    </button>
    {open && <div className="px-5 pb-5 pt-1">{children}</div>}
  </div>
);

export function Sidebar({ isOpen, onToggle, setVideoUrl }: SidebarProps) {
  const [openCard, setOpenCard] = useState<'prompt' | 'persona' | 'technical' | 'output' | 'advanced'>('prompt');
  const [preset, setPreset] = useState<any | null>(null);
  // State for prompt/persona/style/maxLength
  const [prompt, setPrompt] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [persona, setPersona] = useState('tech');
  const [style, setStyle] = useState('memes');
  const [touched, setTouched] = useState(false);
  const [model, setModel] = useState('gpt-4.1-nano');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [promptStyle, setPromptStyle] = useState('default');
  // Suggestion logic (reuse from ScriptSettings)
  const analyzePrompt = (prompt: string) => {
    let suggestion = '';
    if (prompt.toLowerCase().includes('mars')) {
      suggestion = 'Try style: "Cinematic, Epic" and persona: "Documentary narrator"';
    } else if (prompt.toLowerCase().includes('joke') || prompt.toLowerCase().includes('funny')) {
      suggestion = 'Try persona: "Comedian" and style: "Memes"';
    } else if (prompt.toLowerCase().includes('explain') || prompt.toLowerCase().includes('learn')) {
      suggestion = 'Try persona: "Professor" and style: "Artistic"';
    }
    return suggestion;
  };
  useEffect(() => {
    if (preset) {
      setPrompt(preset.prompt || '');
      setPersona(preset.persona || 'tech');
      setStyle(preset.style || 'memes');
    }
  }, [preset]);
  const suggestion = analyzePrompt(prompt);
  // TODO: Replace with real completion logic
  const promptComplete = false;
  const personaComplete = false;
  const technicalComplete = false;
  const outputComplete = false;

  const isFormValid = prompt && persona && style && maxLength && model;
  const handleGenerate = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          persona,
          style,
          maxLength: Number(maxLength),
          model,
          provider: 'openai',
          promptStyle,
        }),
      });
      if (!res.ok) {
        // Try to parse error JSON if possible
        let errorMsg = 'Request failed';
        try {
          const errJson = await res.json();
          errorMsg = errJson.error || errorMsg;
        } catch {}
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`transition-all duration-300 flex flex-col border border-black rounded-2xl shadow-panel bg-background ${isOpen ? 'w-[380px]' : 'w-[60px]'} p-4 m-4`}>
      <PresetsBar onPreset={setPreset} />
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-black">
        <h2 className={`font-bold text-2xl tracking-tight ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>Parameters</h2>
        <button onClick={onToggle} className="p-2 bg-primary/80 hover:bg-primary rounded-full transition-colors">
          <span className="w-5 h-5 text-white">◀</span>
        </button>
      </div>
      {isOpen && <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        <Card
          title="Prompt"
          completed={promptComplete}
          open={openCard === 'prompt'}
          onToggle={() => setOpenCard('prompt')}
        >
          <PromptSettings
            prompt={prompt}
            setPrompt={setPrompt}
            maxLength={maxLength}
            setMaxLength={setMaxLength}
            touched={touched}
            setTouched={setTouched}
            suggestion={suggestion}
          />
        </Card>
        <Card
          title="Persona & Style"
          completed={personaComplete}
          open={openCard === 'persona'}
          onToggle={() => setOpenCard('persona')}
        >
          <PersonaStyleSettings
            persona={persona}
            setPersona={setPersona}
            style={style}
            setStyle={setStyle}
          />
        </Card>
        {isOpen && <Card
          title="Advanced"
          completed={false}
          open={openCard === 'advanced'}
          onToggle={() => setOpenCard('advanced')}
        >
          <div className="flex flex-col gap-3">
            <label className="font-label text-neutral">Model</label>
            <select
              className="w-full rounded-xl border bg-background p-2 font-body text-base"
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              <option value="gpt-4.1-nano">gpt-4.1-nano</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              <option value="gpt-4">gpt-4</option>
            </select>
            <label className="font-label text-neutral">Prompt Style</label>
            <select
              className="w-full rounded-xl border bg-background p-2 font-body text-base"
              value={promptStyle}
              onChange={e => setPromptStyle(e.target.value)}
            >
              <option value="dev-meme">Dev Meme</option>
              <option value="documentary">Documentary</option>
              <option value="narrator">Narrator</option>
              <option value="dialogue">Dialogue</option>
            </select>
          </div>
        </Card>}
      </div>}
      {/* Place only the OutputOptions button at the bottom, outside of any card */}
      {isOpen && <div className="mt-6 px-2">
        <OutputOptions onlyButton onGenerate={handleGenerate} loading={loading} disabled={!isFormValid || loading} />
      </div>}
    </div>
  );
}