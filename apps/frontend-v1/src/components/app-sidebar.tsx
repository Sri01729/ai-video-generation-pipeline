"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconPuzzle,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { SparklesText } from "@/components/ui/sparkles-text"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import Link from "next/link"

const data = {
  user: {
    name: "sai srinivas alahari",
    email: "sai@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Projects",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "#",
      icon: IconUsers,
    },
  ],
  videoPipeline: [
    {
      title: "New Video",
      url: "#",
      icon: IconCamera,
    },
    {
      title: "Recent Jobs",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Pipeline Status",
      url: "#",
      icon: IconInnerShadowTop,
    },
  ],
  assets: [
    {
      title: "Upload Asset",
      url: "#",
      icon: IconFileAi,
    },
    {
      title: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
  ],
  logs: [
    {
      title: "Job Queue",
      url: "#",
      icon: IconReport,
    },
    {
      title: "Logs",
      url: "#",
      icon: IconFileDescription,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

const pluginRoutes = [
  {
    title: "AI Script Author",
    description: "Craft compelling video scripts with AI",
    href: "/plugins/script-author"
  },
  {
    title: "Script-to-Voice Synthesizer",
    description: "Transform scripts into voiceovers",
    href: "/plugins/voice-synthesizer"
  },
  {
    title: "Script-to-Image Renderer",
    description: "Visualize scripts as stunning images",
    href: "/plugins/image-renderer"
  },
  {
    title: "Image Sequence Video Builder",
    description: "Assemble images into dynamic videos",
    href: "/plugins/video-builder"
  },
  {
    title: "Audio-to-Subtitle Transcriber",
    description: "Generate accurate subtitles from audio",
    href: "/plugins/subtitle-transcriber"
  }
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                {/* <img src="/maaya_logo_transparent.svg" alt="Maaya Logo" style={{ height: 24, width: 'auto', marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} /> */}
                <SparklesText
                                    text="Maaya"
                                    className="inline text-xl font-medium tracking-tight"
                                    colors={{ first: "#000", second: "#fff" }}
                                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* Video Pipeline Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Video Pipeline</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.videoPipeline.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Assets Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Assets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.assets.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Logs & Monitoring Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Logs & Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.logs.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Plugins Dropdown Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Plugins</SidebarGroupLabel>
          <SidebarGroupContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="Plugins">
                  <IconPuzzle />
                  <span>Plugins</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                {pluginRoutes.map((route) => (
                  <DropdownMenuItem key={route.href} asChild>
                    <Link href={route.href}>
                  <div>
                        <div className="font-medium">{route.title}</div>
                        <div className="text-xs text-muted-foreground">{route.description}</div>
                  </div>
                    </Link>
                </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
