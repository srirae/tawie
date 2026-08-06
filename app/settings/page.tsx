"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Download, Globe, Rocket } from "lucide-react";
import Link from "next/link";
import { useI18n, useTranslations } from "@/components/i18n-provider";
import { LOCALES, type Locale } from "@/lib/i18n/messages";

export default function SettingsPage() {
  const t = useTranslations();
  const { locale, setLocale } = useI18n();
  const [launchAtStartup, setLaunchAtStartup] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    // Load launch at startup from Electron
    if (typeof window !== "undefined" && window.systemAPI) {
      window.systemAPI.getLaunchAtStartup().then((enabled) => {
        setLaunchAtStartup(enabled);
      });
    }
  }, []);

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
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary-accent">
            {t("settings.title")}
          </h1>
        </div>

        <div className="space-y-8">
          {/* General Settings */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" /> {t("settings.general")}
            </h2>
            <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t("settings.launchAtStartup")}</h3>
                <p className="text-sm text-muted-foreground">{t("settings.launchAtStartupDesc")}</p>
              </div>
              <button
                onClick={() => handleLaunchToggle(!launchAtStartup)}
                className={`w-12 h-6 rounded-full transition-colors relative ${launchAtStartup ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${launchAtStartup ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </section>

          {/* Localization */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> {t("settings.localization")}
            </h2>
            <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t("settings.language")}</h3>
                <p className="text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
              </div>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="bg-background border border-border rounded-lg p-2 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Browser Sandbox */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" /> {t("settings.browserSandbox")}
            </h2>
            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Chromium</h3>
                  <p className="text-sm text-muted-foreground">{t("settings.chromiumDesc")}</p>
                </div>
                <Button
                  onClick={() => handleInstallBrowser('Chromium')}
                  disabled={installing === 'Chromium'}
                  variant="secondary"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {installing === 'Chromium' ? t("settings.installing") : t("settings.install")}
                </Button>
              </div>

              <div className="h-px bg-border w-full" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Firefox</h3>
                  <p className="text-sm text-muted-foreground">{t("settings.firefoxDesc")}</p>
                </div>
                <Button
                  onClick={() => handleInstallBrowser('Firefox')}
                  disabled={installing === 'Firefox'}
                  variant="secondary"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {installing === 'Firefox' ? t("settings.installing") : t("settings.install")}
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
