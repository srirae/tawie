"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { SiGooglechrome, SiFirefoxbrowser } from "react-icons/si";
import type { IconType } from "react-icons";
import { Button } from "@/components/ui/button";
import { AuthShell } from "./auth-shell";
import { MainUI } from "./main-ui";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";
import { useI18n, useTranslations } from "@/components/i18n-provider";
import { LOCALES, type Locale } from "@/lib/i18n/messages";

const STEP_COUNT = 3;

export function OnboardingShowcasePage() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const done = localStorage.getItem("tawie-onboarding-complete");
    setIsOnboarded(done === "true");
  }, []);

  if (isOnboarded === null) return null; // loading

  if (isOnboarded) {
    return <MainUI />;
  }

  return (
    <AuthShell variant="onboarding">
      <OnboardingFlow
        onComplete={() => {
          localStorage.setItem("tawie-onboarding-complete", "true");
          setIsOnboarded(true);
        }}
      />
    </AuthShell>
  );
}

function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  };
  const back = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
  };

  return (
    <div className="w-full max-w-lg">
      <Stepper step={step} />

      <div className="relative">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {step === 0 ? <LanguageStep onContinue={next} /> : null}
            {step === 1 ? <SystemCheckStep onContinue={next} onBack={back} /> : null}
            {step === 2 ? <BrowserStep onContinue={onComplete} onBack={back} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const t = useTranslations();
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-foreground/70 uppercase tracking-[0.3em]">
      <span>
        {t("onboarding.stepper", {
          current: String(step + 1).padStart(2, "0"),
          total: STEP_COUNT,
        })}
      </span>
      <div className="ml-2 flex items-center gap-1.5">
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <motion.span
            key={i}
            className={`h-1.5 rounded-full ${
              i === step
                ? "bg-foreground"
                : i < step
                  ? "bg-foreground/70"
                  : "bg-foreground/20"
            }`}
            animate={{ width: i === step ? 20 : 6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        ))}
      </div>
    </div>
  );
}

function LanguageStep({ onContinue }: { onContinue: () => void }) {
  const t = useTranslations();
  const { locale, setLocale } = useI18n();

  return (
    <>
      <div className="mt-8 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
        {t("onboarding.languageEyebrow")}
      </div>
      <h1 className="mt-2 font-heading text-3xl leading-tight">
        {t("onboarding.languageTitle")}
      </h1>

      <div className="mt-8 flex flex-col gap-4">
        <select
          className="w-full rounded-md border border-border bg-background p-3 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.label}
            </option>
          ))}
        </select>
        <Button size="lg" onClick={onContinue} className="mt-2">
          {t("common.continue")}
        </Button>
      </div>
    </>
  );
}

function SystemCheckStep({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const t = useTranslations();
  const [sysInfo, setSysInfo] = useState<{ totalmem?: number; platform?: string } | null>(null);
  const [storage, setStorage] = useState<{ freeBytes?: number } | null>(null);
  const [dockerInstalled, setDockerInstalled] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      if (typeof window !== "undefined" && window.systemAPI) {
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

  const ramGB = sysInfo?.totalmem ? Math.round(sysInfo.totalmem / 1024 ** 3) : 0;
  const storageGB = storage?.freeBytes ? Math.round(storage.freeBytes / 1024 ** 3) : 0;

  const ramOk = ramGB >= 8;
  const storageOk = storageGB >= 5;
  const allOk = ramOk && storageOk && dockerInstalled;

  const steps = [
    { id: 1, title: t("onboarding.ramCheck", { value: ramGB }), isCompleted: ramOk },
    { id: 2, title: t("onboarding.storageCheck", { value: storageGB }), isCompleted: storageOk },
    { id: 3, title: t("onboarding.osCheck", { value: sysInfo?.platform || "Unknown" }), isCompleted: !!sysInfo?.platform },
    { id: 4, title: dockerInstalled ? t("onboarding.dockerInstalled") : t("onboarding.dockerWaiting"), isCompleted: !!dockerInstalled },
  ];

  return (
    <>
      <div className="mt-8 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em] text-center">
        {t("onboarding.systemEyebrow")}
      </div>
      <h1 className="mt-2 font-heading text-3xl leading-tight text-center">
        {t("onboarding.systemTitle")}
      </h1>

      <div className="mt-8 flex flex-col gap-3">
        {checking ? (
          <p>{t("onboarding.systemChecking")}</p>
        ) : (
          <OnboardingChecklist steps={steps} title={t("onboarding.systemChecklistTitle")} />
        )}

        <div className="mt-4 flex gap-4">
          <Button variant="ghost" onClick={onBack}>
            {t("common.back")}
          </Button>
          <Button size="lg" disabled={!allOk} onClick={onContinue} className="flex-1">
            {t("common.continue")}
          </Button>
        </div>
      </div>
    </>
  );
}

type BrowserOption = { id: string; name: string; Icon: IconType; color: string };

// Grouped so more browsers (Brave, Opera, Edge, …) can slot in later without
// the list becoming an undifferentiated stack.
const BROWSER_GROUPS: { key: string; browsers: BrowserOption[] }[] = [
  {
    key: "onboarding.browserGroupChromium",
    browsers: [
      { id: "Chromium", name: "Chromium", Icon: SiGooglechrome, color: "#4285F4" },
    ],
  },
  {
    key: "onboarding.browserGroupOther",
    browsers: [
      { id: "Firefox", name: "Firefox", Icon: SiFirefoxbrowser, color: "#FF7139" },
    ],
  },
];

function BrowserStep({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const t = useTranslations();
  const [selected, setSelected] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const toggle = (b: string) => {
    setSelected((s) => (s.includes(b) ? s.filter((x) => x !== b) : [...s, b]));
  };

  const finish = async () => {
    if (selected.length > 0) {
      setDownloading(true);
      if (typeof window !== "undefined" && window.systemAPI) {
        for (const browser of selected) {
          try {
            await window.systemAPI.dockerPull(`lscr.io/linuxserver/${browser.toLowerCase()}`);
          } catch {
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
        {t("onboarding.browserEyebrow")}
      </div>
      <h1 className="mt-2 font-heading text-3xl leading-tight">
        {t("onboarding.browserTitle")}
      </h1>

      <div className="mt-8 flex flex-col gap-5">
        {BROWSER_GROUPS.map((group) => (
          <div key={group.key} className="flex flex-col gap-2">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              {t(group.key)}
            </div>
            {group.browsers.map((b) => {
              const isSelected = selected.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggle(b.id)}
                  aria-pressed={isSelected}
                  className={`group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150 ease-out hover:-translate-y-px ${
                    isSelected
                      ? "border-2 border-primary bg-primary/5"
                      : "border-border hover:bg-card"
                  }`}
                >
                  <b.Icon
                    size={24}
                    style={{ color: b.color }}
                    className={`shrink-0 transition-opacity ${isSelected ? "opacity-100" : "opacity-50"}`}
                  />
                  <span className="font-medium text-foreground">{b.name}</span>
                  {isSelected ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}

        <div className="flex gap-4 mt-2">
          <Button variant="ghost" onClick={onBack}>
            {t("common.back")}
          </Button>
          <Button variant="ghost" onClick={onContinue}>
            {t("onboarding.skip")}
          </Button>
          <Button onClick={finish} disabled={downloading}>
            {downloading ? t("onboarding.downloading") : t("onboarding.finish")}
          </Button>
        </div>
      </div>
    </>
  );
}
