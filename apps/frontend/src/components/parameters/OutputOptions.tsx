import React, { useState } from 'react';

export function OutputOptions({ onlyButton = false, onGenerate, loading = false, disabled = false, success = false }: { onlyButton?: boolean, onGenerate?: () => void, loading?: boolean, disabled?: boolean, success?: boolean }) {
  const handleClick = () => {
    if (onGenerate) onGenerate();
  };
  if (onlyButton) {
    return (
      <button
        className={`mt-6 w-full py-4 rounded-xl font-header text-lg shadow-lg transition-all duration-200 flex items-center justify-center
          border-2 border-black text-black bg-purple-500
          ${loading ? 'bg-gradient-to-tr from-primary to-secondary opacity-80' : ''}
        `}
        style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
        onClick={handleClick}
        disabled={disabled || loading || success}
      >
        {!loading && !success && 'Generate Video'}
        {loading && (
          <span className="w-6 h-6 mr-2 flex items-center justify-center">
            <span className="inline-block w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </span>
        )}
        {success && <><span className="w-6 h-6 mr-2">✓</span> Success</>}
      </button>
    );
  }
  return (
    <>
      <div className="flex items-center justify-between">
        <label className="font-label text-neutral">Streaming</label>
        <button className="w-12 h-6 rounded-full bg-background border border-neutral relative" aria-label="Toggle streaming">
          <div className="absolute left-1 top-1 w-4 h-4 bg-neutral rounded-full" />
        </button>
      </div>
      <button
        className={`mt-6 w-full py-4 rounded-xl font-header text-lg shadow-lg transition-all duration-200 flex items-center justify-center
          border-2 border-black text-black bg-purple-500
          ${loading ? 'bg-gradient-to-tr from-primary to-secondary opacity-80' : ''}
        `}
        style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
        onClick={handleClick}
        disabled={disabled || loading || success}
      >
        {!loading && !success && 'Generate Video'}
        {loading && (
          <span className="w-6 h-6 mr-2 flex items-center justify-center">
            <span className="inline-block w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </span>
        )}
        {success && <><span className="w-6 h-6 mr-2">✓</span> Success</>}
      </button>
    </>
  );
}