import React from 'react';

export function AIProvider() {
  return <>

    <label className="block font-label text-neutral mb-2">Provider</label>
    <select className="w-full rounded-xl border border-neutral bg-background p-2 font-body text-base">
      <option>OpenAI</option>
      <option>Google</option>
      <option>Anthropic</option>
      <option>Cohere</option>
      <option>xAI</option>
    </select>
    <label className="block font-label text-neutral mb-2">Model</label>
    <select className="w-full rounded-xl border border-neutral bg-background p-2 font-body text-base">
      <option>gpt-4</option>
      <option>gemini-2.0-flash</option>
      <option>claude-3-opus</option>
      <option>grok-1</option>
    </select>
    <label className="block font-label text-neutral mb-2">API Key</label>
    <input type="password" className="w-full rounded-xl border border-neutral bg-background p-2 font-body text-base" placeholder="Enter your API key" />
  </>;
}