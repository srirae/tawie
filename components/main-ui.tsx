"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/i18n-provider";
import { Clock, Check, ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BROWSERS = [
  { id: "Chromium", name: "Chromium", dot: "var(--primary)" },
  { id: "Firefox", name: "Firefox", dot: "var(--secondary-accent)" },
] as const;

const DEFAULT_BROWSER_KEY = "tawie-default-browser";
const SESSIONS_KEY = "tawie-sessions";

type Session = {
  id: string;
  url: string;
  domain: string;
  browser: string;
  durationMins: number | null;
  ts: number;
};

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function domainOf(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

const TIME_PRESETS = [5, 10, 20, 30] as const;

function greetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "home.greetingMorning";
  if (hour < 18) return "home.greetingAfternoon";
  return "home.greetingEvening";
}

export function MainUI() {
  const t = useTranslations();
  const greeting = t(greetingKey());
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [starting, setStarting] = useState(false);
  const [dockerConnected, setDockerConnected] = useState<boolean | null>(null);
  // Restore persisted default browser (MainUI only mounts client-side, after
  // the onboarding gate resolves, so reading localStorage here is safe).
  const [browser, setBrowser] = useState<string>(() => {
    if (typeof window === "undefined") return "Chromium";
    try {
      const saved = localStorage.getItem(DEFAULT_BROWSER_KEY);
      if (saved && BROWSERS.some((b) => b.id === saved)) return saved;
    } catch {
      /* ignore */
    }
    return "Chromium";
  });
  const [sessions, setSessions] = useState<Session[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(SESSIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return [];
  });

  // Docker connection status, polled so the pill stays live.
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (typeof window !== "undefined" && window.systemAPI) {
        try {
          const ok = await window.systemAPI.checkDocker();
          if (active) setDockerConnected(ok);
        } catch {
          if (active) setDockerConnected(false);
        }
      } else if (active) {
        setDockerConnected(false);
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const selectBrowser = (id: string) => {
    setBrowser(id);
    try {
      localStorage.setItem(DEFAULT_BROWSER_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const recordSession = (session: Session) => {
    setSessions((prev) => {
      const next = [session, ...prev].slice(0, 10);
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const urlTouched = url.trim().length > 0;
  const urlInvalid = urlTouched && !isValidUrl(url);

  const handleLaunch = async () => {
    if (!isValidUrl(url)) return;
    setStarting(true);
    if (typeof window !== "undefined" && window.systemAPI) {
      try {
        // First ensure the browser is pulled if not already
        await window.systemAPI.dockerPull(`lscr.io/linuxserver/${browser.toLowerCase()}`);
      } catch {
        console.warn(`Failed to pull ${browser} docker image. Is Docker running?`);
      }
      // In a real app, this would start the docker container and open the connection.
      alert(`Starting ${browser} sandbox for ${url} (Limit: ${timeLimit ? timeLimit + " mins" : "None"})`);
    }
    recordSession({
      id: `${Date.now()}`,
      url,
      domain: domainOf(url),
      browser,
      durationMins: timeLimit,
      ts: Date.now(),
    });
    setStarting(false);
  };

  const selectedBrowser = BROWSERS.find((b) => b.id === browser) ?? BROWSERS[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 transition-colors bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-accent/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-2xl text-center mb-8 relative z-10">
         <h1 className="font-heading text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary-accent animate-in fade-in slide-in-from-bottom-4">
           {greeting}!
         </h1>
         <p className="mt-4 text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-5 delay-75 fill-mode-both">
           {t("home.subtitle")}
         </p>
      </div>

      <div className="w-full max-w-2xl relative animate-in fade-in slide-in-from-bottom-6 delay-150 fill-mode-both z-10">
         <div
           className={`rounded-3xl glass-panel p-3 flex flex-col gap-3 transition-all ${
             urlInvalid
               ? "ring-2 ring-destructive/60"
               : "focus-within:ring-2 focus-within:ring-primary/50"
           }`}
         >
            {/* Docker connection status */}
            <div className="flex items-center justify-between px-2 pt-1">
               <DockerPill connected={dockerConnected} />
            </div>

            <textarea
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               placeholder="https://example.com"
               aria-invalid={urlInvalid}
               className="w-full resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground px-4 pb-2 text-xl"
               rows={2}
               autoFocus
            />

            <div className="flex items-center justify-between border-t border-border pt-3 px-2">
                <div className="flex items-center gap-2">
                   <TimeLimitPopover value={timeLimit} onChange={setTimeLimit} />
                </div>

                <div className="flex items-center gap-2">
                    {/* Browser selector */}
                    <DropdownMenu>
                       <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-10 px-3 text-foreground border border-border bg-card">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: selectedBrowser.dot }} />
                          {selectedBrowser.name}
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="min-w-52">
                          <DropdownMenuGroup>
                             <DropdownMenuLabel>{t("home.selectBrowser")}</DropdownMenuLabel>
                             {BROWSERS.map((b) => (
                                <DropdownMenuItem
                                   key={b.id}
                                   onClick={() => selectBrowser(b.id)}
                                   className="cursor-pointer justify-between"
                                >
                                   <span className="flex items-center gap-2">
                                      <span className="size-2.5 rounded-full" style={{ backgroundColor: b.dot }} />
                                      {b.name}
                                   </span>
                                   {browser === b.id ? <Check className="w-4 h-4 text-primary" /> : null}
                                </DropdownMenuItem>
                             ))}
                          </DropdownMenuGroup>
                       </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                       variant="default"
                       size="lg"
                       disabled={!isValidUrl(url) || starting}
                       onClick={handleLaunch}
                       className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                    >
                        {starting ? t("home.starting") : t("home.launch")}
                    </Button>
                </div>
            </div>
         </div>

         {urlInvalid ? (
            <p className="mt-2 px-3 text-sm text-destructive">
               {t("home.urlHelper")}
            </p>
         ) : null}
      </div>

      {/* Recent sessions */}
      <div className="w-full max-w-2xl relative z-10 mt-10 animate-in fade-in slide-in-from-bottom-6 delay-200 fill-mode-both">
         <h2 className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em] mb-3 px-1">
            {t("home.recentSessions")}
         </h2>
         <RecentSessions sessions={sessions} />
      </div>
    </div>
  );
}

function DockerPill({ connected }: { connected: boolean | null }) {
  const t = useTranslations();
  const connectedState = connected === true;
  const label =
    connected === null
      ? t("home.dockerChecking")
      : connectedState
        ? t("home.dockerConnected")
        : t("home.dockerNotRunning");
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
      <span
        className={`size-2 rounded-full ${
          connected === null ? "bg-muted-foreground animate-pulse" : connectedState ? "bg-success" : "bg-destructive"
        }`}
      />
      {label}
    </span>
  );
}

function TimeLimitPopover({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const applyCustom = () => {
    const n = parseInt(custom, 10);
    if (!Number.isNaN(n) && n > 0) {
      onChange(n);
      setCustom("");
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none h-10 px-4 text-muted-foreground border border-border bg-card hover:bg-accent hover:text-foreground"
      >
        <Clock className="w-4 h-4" />
        {value ? t("home.setLimitWith", { value }) : t("home.setLimit")}
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl bg-popover text-popover-foreground p-1 shadow-2xl ring-1 ring-border z-50">
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                onChange(preset);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {preset}m
              {value === preset ? <Check className="w-4 h-4 text-primary" /> : null}
            </button>
          ))}
          <div className="my-1 h-px bg-border" />
          <div className="flex items-center gap-1.5 p-1">
            <input
              type="number"
              min={1}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCustom();
              }}
              placeholder={t("home.customPlaceholder")}
              className="w-full min-w-0 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button size="sm" onClick={applyCustom} className="rounded-lg">
              {t("common.set")}
            </Button>
          </div>
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {t("home.clearLimit")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RecentSessions({ sessions }: { sessions: Session[] }) {
  const t = useTranslations();
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t("home.emptySessions")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
        >
          <SessionFavicon domain={s.domain} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">{s.domain}</div>
            <div className="truncate text-xs text-muted-foreground">
              {s.browser} · {s.durationMins ? `${s.durationMins}m` : t("home.noLimit")}
            </div>
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            {new Date(s.ts).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionFavicon({ domain }: { domain: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Globe className="w-4 h-4" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      alt=""
      width={32}
      height={32}
      onError={() => setFailed(true)}
      className="size-8 shrink-0 rounded-lg bg-muted object-contain"
    />
  );
}
