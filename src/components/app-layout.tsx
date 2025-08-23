"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Settings,
  Sun,
  Moon,
  BrainCircuit,
  PenSquare,
} from "lucide-react";
import useLocalStorage from "@/hooks/use-local-storage";
import { useAgents } from "@/hooks/use-agents";
import { useToast } from "@/hooks/use-toast";
import { executeAgent, type AgentContext, type AgentDefinition } from "@/ai/flows/mini-agent-execution";


const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compose", label: "Compose", icon: MessageSquare },
  { href: "/agents", label: "Mini-Agents", icon: Bot },
  { href: "/studio", label: "Studio", icon: PenSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");
  const [isClient, setIsClient] = useState(false);
  const [autorunAgents] = useLocalStorage('autorunAgents', false);
  const { agents } = useAgents();
  const { toast } = useToast();

  const handleClientSideActions = (result: AgentContext) => {
    if (result.clipboardContent) {
      navigator.clipboard.writeText(String(result.clipboardContent));
      toast({ title: "Copied to clipboard" });
    }
    if (result.notification) {
      new Notification(result.notification.title, { body: result.notification.body });
    }
    if (result.share) {
      if (navigator.share) {
        navigator.share(result.share);
      } else {
        toast({ variant: 'destructive', title: 'Share not supported', description: 'Your browser does not support the Web Share API.' });
      }
    }
  };

  const requestPermissions = async (agentPermissions: string[]) => {
    if (agentPermissions.includes('notification')) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Notification permission is required to run agents.' });
            return false;
        }
    }
    return true;
  }

  useEffect(() => {
    if (isClient && autorunAgents) {
      toast({ title: "Auto-Run Enabled", description: `Running ${agents.length} agents...` });
      agents.forEach(async (agent) => {
        const permissionsGranted = await requestPermissions(agent.permissions);
        if (!permissionsGranted) {
            toast({ variant: 'destructive', title: `Permissions denied for ${agent.name}`, description: 'Cannot execute agent.'});
            return;
        }
        try {
          const result = await executeAgent(agent as AgentDefinition);
          handleClientSideActions(result);
          toast({ title: "Agent Executed", description: `"${agent.name}" ran successfully.` });
        } catch (error) {
           toast({ variant: "destructive", title: `Agent Failed: ${agent.name}`, description: String(error) });
        }
      });
    }
  }, [isClient, autorunAgents, pathname]); // Reruns on path change (refresh-like behavior)

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-headline font-bold">AI Hub</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {isClient && (
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start gap-2"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon /> : <Sun />}
              <span>Toggle Theme</span>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
