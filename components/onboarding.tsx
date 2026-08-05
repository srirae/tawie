"use client";

import { type FormEvent, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AuthShell, useAuthTypingImpulse } from "./auth-shell";
import { MainUI } from "./main-ui";

const STEPS = ["Language", "System Checks", "Browsers"] as const;

export function OnboardingShowcasePage() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    const done = localStorage.getItem('tawie-onboarding-complete');
    const savedLang = localStorage.getItem('tawie-language');
    if (savedLang) setLanguage(savedLang);
    setIsOnboarded(done === 'true');
  }, []);

  if (isOnboarded === null) return null; // loading

  if (isOnboarded) {
    return <MainUI language={language} />;
  }

  return (
    <AuthShell variant="onboarding">
      <OnboardingFlow 
         onComplete={() => {
            localStorage.setItem('tawie-onboarding-complete', 'true');
            setIsOnboarded(true);
         }} 
         language={language}
         setLanguage={(l) => {
            setLanguage(l);
            localStorage.setItem('tawie-language', l);
         }}
      />
    </AuthShell>
  );
}

function OnboardingFlow({ onComplete, language, setLanguage }: { onComplete: () => void, language: string, setLanguage: (l: string) => void }) {
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="w-full max-w-lg">
      <Stepper step={step} />

      {step === 0 ? (
        <LanguageStep value={language} onChange={setLanguage} onContinue={next} />
      ) : null}

      {step === 1 ? (
        <SystemCheckStep onContinue={next} onBack={back} />
      ) : null}

      {step === 2 ? (
        <BrowserStep onContinue={onComplete} onBack={back} />
      ) : null}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-foreground/70 uppercase tracking-[0.3em]">
      <span>
        Step {String(step + 1).padStart(2, "0")} / {STEPS.length}
      </span>
      <div className="ml-2 flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step
                ? "w-5 bg-foreground"
                : i < step
                  ? "w-1.5 bg-foreground/70"
                  : "w-1.5 bg-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function LanguageStep({ value, onChange, onContinue }: { value: string; onChange: (v: string) => void; onContinue: () => void }) {
  const languages = [
    { name: "English", flag: "🇺🇸" },
    { name: "Spanish", flag: "🇪🇸" },
    { name: "French", flag: "🇫🇷" },
    { name: "German", flag: "🇩🇪" },
    { name: "Japanese", flag: "🇯🇵" },
  ];

  return (
    <>
      <div className="mt-8 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
        Language Preference
      </div>
      <h1 className="mt-2 font-heading text-3xl leading-tight">
        Pick your preferred Language
      </h1>
      
      <div className="mt-8 flex flex-col gap-4">
        <select 
          className="w-full rounded-md border border-border bg-background p-3 text-foreground"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {languages.map(l => (
            <option key={l.name} value={l.name}>{l.name}</option>
          ))}
        </select>
        <Button size="lg" onClick={onContinue} className="mt-2">
          Continue
        </Button>
      </div>
    </>
  );
}

import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";

function SystemCheckStep({ onContinue, onBack }: { onContinue: () => void, onBack: () => void }) {
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [storage, setStorage] = useState<any>(null);
  const [dockerInstalled, setDockerInstalled] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      if (typeof window !== 'undefined' && window.systemAPI) {
        const info = await window.systemAPI.getSystemInfo();
        const store = await window.systemAPI.getStorageInfo();
        setSysInfo(info);
        setStorage(store);

        const checkDockerStatus = async () => {
          if (!window.systemAPI) return;
          const isDocker = await window.systemAPI.checkDocker();
          setDockerInstalled(isDocker);
          if (!isDocker) {
             window.systemAPI.openExternal("https://docs.docker.com/get-docker/");
             const interval = setInterval(async () => {
               if (!window.systemAPI) return;
               const stillDocker = await window.systemAPI.checkDocker();
               if (stillDocker) {
                  setDockerInstalled(true);
                  clearInterval(interval);
               }
             }, 3000);
          }
        };

        await checkDockerStatus();
      }
      setChecking(false);
    }
    check();
  }, []);

  const ramGB = sysInfo ? Math.round(sysInfo.totalmem / (1024 ** 3)) : 0;
  const storageGB = storage ? Math.round(storage.freeBytes / (1024 ** 3)) : 0;

  const ramOk = ramGB >= 8;
  const storageOk = storageGB >= 5;
  const allOk = ramOk && storageOk && dockerInstalled;

  const steps = [
    { id: 1, title: `RAM Check (>= 8GB) - Found: ${ramGB}GB`, isCompleted: ramOk },
    { id: 2, title: `Storage Check (>= 5GB free) - Found: ${storageGB}GB`, isCompleted: storageOk },
    { id: 3, title: `OS check - ${sysInfo?.platform || 'Unknown'}`, isCompleted: !!sysInfo?.platform },
    { id: 4, title: dockerInstalled ? `Docker Installed` : `Waiting for Docker installation...`, isCompleted: !!dockerInstalled }
  ];

  return (
    <>
      <div className="mt-8 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em] text-center">
        System Checks
      </div>
      <h1 className="mt-2 font-heading text-3xl leading-tight text-center">
        Ensuring you're ready
      </h1>
      
      <div className="mt-8 flex flex-col gap-3">
        {checking ? <p>Checking system...</p> : (
          <OnboardingChecklist steps={steps} title="System Requirements" />
        )}

        <div className="mt-4 flex gap-4">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button size="lg" disabled={!allOk} onClick={onContinue} className="flex-1">
            Continue
          </Button>
        </div>
      </div>
    </>
  );
}

function BrowserStep({ onContinue, onBack }: { onContinue: () => void, onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const toggle = (b: string) => {
    setSelected(s => s.includes(b) ? s.filter(x => x !== b) : [...s, b]);
  };

  const finish = async () => {
    if (selected.length > 0) {
      setDownloading(true);
      if (typeof window !== 'undefined' && window.systemAPI) {
         for (const browser of selected) {
            try {
               await window.systemAPI.dockerPull(`lscr.io/linuxserver/${browser.toLowerCase()}`);
            } catch (err) {
               console.warn(`Failed to pull ${browser} docker image. Is Docker running?`);
            }
         }
      }
      setDownloading(false);
    }
    onContinue();
  };

  return (
    <>
      <div className="mt-8 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
        Almost done
      </div>
      <h1 className="mt-2 font-heading text-3xl leading-tight">
        Welcome to Tawie, a disposable browser sandbox for the links you don't trust.
      </h1>
      
      <div className="mt-8 flex flex-col gap-2">
        <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-card">
          <input type="checkbox" checked={selected.includes("Chromium")} onChange={() => toggle("Chromium")} />
          Chromium
        </label>
        <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-card">
          <input type="checkbox" checked={selected.includes("Firefox")} onChange={() => toggle("Firefox")} />
          Firefox
        </label>

        <div className="flex gap-4 mt-6">
           <Button variant="ghost" onClick={onBack}>Back</Button>
           <Button variant="ghost" onClick={onContinue}>Skip for now</Button>
           <Button onClick={finish} disabled={downloading}>
              {downloading ? 'Downloading...' : 'Take me in'}
           </Button>
        </div>
      </div>
    </>
  );
}
