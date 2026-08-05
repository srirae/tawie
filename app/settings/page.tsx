"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Download, Globe, Rocket } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [language, setLanguage] = useState("English");
  const [launchAtStartup, setLaunchAtStartup] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    // Load language from localStorage
    const savedLang = localStorage.getItem("tawie-language");
    if (savedLang) setLanguage(savedLang);

    // Load launch at startup from Electron
    if (typeof window !== "undefined" && window.systemAPI) {
      window.systemAPI.getLaunchAtStartup().then((enabled) => {
        setLaunchAtStartup(enabled);
      });
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("tawie-language", lang);
  };

  const handleLaunchToggle = (enabled: boolean) => {
    setLaunchAtStartup(enabled);
    if (typeof window !== "undefined" && window.systemAPI) {
      window.systemAPI.setLaunchAtStartup(enabled);
    }
  };

  const handleInstallBrowser = async (browser: string) => {
    setInstalling(browser);
    if (typeof window !== "undefined" && window.systemAPI) {
      try {
        await window.systemAPI.dockerPull(`lscr.io/linuxserver/${browser.toLowerCase()}`);
        alert(`${browser} installed successfully!`);
      } catch (err) {
        console.warn(err);
        alert(`Failed to install ${browser}. Is Docker Desktop running?`);
      }
    }
    setInstalling(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-3xl glass-panel p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            Settings
          </h1>
        </div>

        <div className="space-y-8">
          {/* General Settings */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" /> General
            </h2>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Launch at Startup</h3>
                <p className="text-sm text-muted-foreground">Start Tawie automatically when you log in.</p>
              </div>
              <button
                onClick={() => handleLaunchToggle(!launchAtStartup)}
                className={`w-12 h-6 rounded-full transition-colors relative ${launchAtStartup ? 'bg-primary' : 'bg-secondary'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${launchAtStartup ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </section>

          {/* Localization */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Localization
            </h2>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Language</h3>
                <p className="text-sm text-muted-foreground">Choose your preferred interface language.</p>
              </div>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-background border border-border rounded-lg p-2 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>
          </section>

          {/* Browser Sandbox */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" /> Browser Sandbox
            </h2>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Chromium</h3>
                  <p className="text-sm text-muted-foreground">The open-source browser project by Google.</p>
                </div>
                <Button 
                  onClick={() => handleInstallBrowser('Chromium')}
                  disabled={installing === 'Chromium'}
                  variant="secondary"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {installing === 'Chromium' ? 'Installing...' : 'Install'}
                </Button>
              </div>
              
              <div className="h-px bg-white/10 w-full" />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Firefox</h3>
                  <p className="text-sm text-muted-foreground">Fast, private, and secure browser by Mozilla.</p>
                </div>
                <Button 
                  onClick={() => handleInstallBrowser('Firefox')}
                  disabled={installing === 'Firefox'}
                  variant="secondary"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {installing === 'Firefox' ? 'Installing...' : 'Install'}
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
