"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import  AnimatedAIChat  from "@/components/ui/animated-ai-chat"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useState } from "react";
import { useRouter } from "next/navigation";

import data from "./data.json"

export default function Page() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return (
    <AnimatedAIChat
      loading={loading}
      onGenerate={async ({ prompt, model, maxLength, provider }) => {
        setLoading(true);
        try {
          const res = await fetch(`${apiUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, model, maxLength, ...(provider ? { provider } : {}) }),
          });
          if (!res.ok) throw new Error('Request failed');
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          router.push(`/home/videoplayer?src=${encodeURIComponent(url)}&prompt=${encodeURIComponent(prompt)}`);
        } catch (err) {
          console.error('onGenerate error', err);
        } finally {
          setLoading(false);
        }
      }}
    />
    /* <SectionCards />
    <div className="px-4 lg:px-6">
      <ChartAreaInteractive />
    </div>
    <DataTable data={data} /> */
  )
}
