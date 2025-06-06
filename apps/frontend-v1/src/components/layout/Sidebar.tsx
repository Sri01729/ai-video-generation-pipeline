import { AnimatedAIChat } from "../ui/animated-ai-chat";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  console.log('Sidebar rendered');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // Use env variable for backend API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return (
    <div className={`transition-all duration-300 flex flex-col border border-black rounded-2xl shadow-panel bg-background ${isOpen ? 'w-[380px]' : 'w-[60px]'} p-4 m-4`}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-black">
        <h2 className={`font-bold text-2xl tracking-tight ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>Parameters</h2>
        <button onClick={onToggle} className="p-2 bg-primary/80 hover:bg-primary rounded-full transition-colors">
          <span className="w-5 h-5 text-white">◀</span>
        </button>
      </div>
      {isOpen && (
        <AnimatedAIChat
          loading={loading}
          onGenerate={async ({ prompt, model, maxLength, provider }) => {
            setLoading(true);
            try {
              console.log('Sidebar onGenerate called', { prompt, model, maxLength, provider });
              const res = await fetch(`${apiUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model, maxLength, ...(provider ? { provider } : {}) }),
              });
              console.log('Sidebar fetch response', res);
              if (!res.ok) throw new Error('Request failed');
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              router.push(`/home/videoplayer?src=${encodeURIComponent(url)}`);
            } catch (err) {
              // Optionally handle error
              console.error('Sidebar onGenerate error', err);
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
}