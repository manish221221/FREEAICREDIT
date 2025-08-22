"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("light");
  const [isClient, setIsClient] = useState(false);
  const [isNoBackendMode, setIsNoBackendMode] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);

    const savedMode = localStorage.getItem("noBackendMode");
    setIsNoBackendMode(savedMode ? JSON.parse(savedMode) : true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const toggleNoBackendMode = (checked: boolean) => {
    setIsNoBackendMode(checked);
    localStorage.setItem("noBackendMode", JSON.stringify(checked));
  };
  
  if (!isClient) {
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Customize your AI Hub experience.
        </p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Appearance</CardTitle>
          <CardDescription>Adjust the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="theme-toggle">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select between light and dark mode.
              </p>
            </div>
            <Button
              id="theme-toggle"
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Data & Privacy</CardTitle>
          <CardDescription>Control how your data is handled.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="no-backend-mode">No-Backend Mode</Label>
                    <p className="text-sm text-muted-foreground">
                        All API calls are made directly from your device.
                    </p>
                </div>
                <Switch
                    id="no-backend-mode"
                    checked={isNoBackendMode}
                    onCheckedChange={toggleNoBackendMode}
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
