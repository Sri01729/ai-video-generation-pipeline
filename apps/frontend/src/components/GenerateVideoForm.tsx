import React, { useState } from 'react';

export default function GenerateVideoForm() {
  const [form, setForm] = useState({
    prompt: '',
    persona: '',
    style: '',
    maxLength: 900,
    model: 'gpt-4.1-nano',
    provider: 'openai',
    outputDir: 'results' // Use results as the output directory
  });
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) setResult(data.output);
      else setError(data.error || 'Unknown error');
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper: convert backend result path to a URL the browser can fetch
  const getVideoUrl = (outputPath: string) => {
    // If outputPath is absolute, just use it
    if (outputPath.startsWith('/')) return outputPath;
    // If outputPath is in results, serve from /results
    if (outputPath.includes('results/')) {
      const idx = outputPath.indexOf('results/');
      return '/' + outputPath.slice(idx);
    }
    // Fallback: just return as is
    return outputPath;
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 24, maxWidth: 500 }}>
      <input name="prompt" placeholder="Prompt" value={form.prompt} onChange={handleChange} required />
      <input name="persona" placeholder="Persona" value={form.persona} onChange={handleChange} required />
      <input name="style" placeholder="Style" value={form.style} onChange={handleChange} required />
      <input name="maxLength" type="number" placeholder="Max Length" value={form.maxLength} onChange={handleChange} required />
      <input name="model" placeholder="Model" value={form.model} onChange={handleChange} required />
      <input name="provider" placeholder="Provider" value={form.provider} onChange={handleChange} required />
      <input name="outputDir" placeholder="Output Dir" value={form.outputDir} onChange={handleChange} required />
      <button type="submit" disabled={loading}>{loading ? 'Generating...' : 'Generate Video'}</button>
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Generated Video:</h3>
          <video controls width={400} src={getVideoUrl(result)} />
          <div style={{ fontSize: 12, color: '#888' }}>Path: {result}</div>
        </div>
      )}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
    </form>
  );
}