import type { ReactNode, RefObject } from "react";
import { createContext, useContext, useRef } from "react";
import { ParticleField } from "@/components/particle-field";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { useTranslations } from "@/components/i18n-provider";

/** Render copy with the literal "Tawie" brand word emphasized. */
function withBrand(text: string) {
  return text.split(/(Tawie)/g).map((part, i) =>
    part === "Tawie" ? (
      <span key={i} className="font-semibold text-primary">
        {part}
      </span>
    ) : (
      part
    ),
  );
}


type ImpulseRef = RefObject<number>;
const TypingImpulseContext = createContext<ImpulseRef | null>(null);

export function useAuthTypingImpulse(): ImpulseRef {
  const ctx = useContext(TypingImpulseContext);
  if (!ctx) throw new Error("useAuthTypingImpulse outside <AuthShell>");
  return ctx;
}

type Variant = "welcome" | "request-access" | "onboarding";



import { useState, useEffect } from "react";

function AsciiMac() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Blink with a natural double-blink cadence.
    let blinkTimer: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 140);
        scheduleBlink();
      }, Math.random() * 4000 + 2000);
    };
    scheduleBlink();

    // Drives the antenna signal + scanline animation.
    const tickInterval = setInterval(() => setTick((t) => (t + 1) % 8), 220);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(blinkTimer);
      clearInterval(tickInterval);
    };
  }, []);

  // Eyes glance toward the cursor on both axes.
  let leftEye = "O";
  let rightEye = "O";
  let mouth = "\\___/";

  if (isBlinking) {
    leftEye = "-";
    rightEye = "-";
    mouth = "___";
  } else {
    if (mousePos.x < 0.4) { leftEye = "°"; rightEye = "O"; }
    else if (mousePos.x > 0.6) { leftEye = "O"; rightEye = "°"; }
    else if (mousePos.y < 0.35) { leftEye = "^"; rightEye = "^"; }
    else { leftEye = "O"; rightEye = "O"; }

    if (mousePos.y < 0.3) mouth = " o ";
    else if (mousePos.y > 0.7) mouth = "\\___/";
    else mouth = " __ ";
  }

  // Antenna signal strength cycles to read as "listening".
  const bars = 1 + (tick % 4);
  const antenna = "·".repeat(bars) + " ".repeat(4 - bars);
  // A scanline sweeps down the screen area.
  const scanRow = tick % 6;
  const screenRows = [0, 1, 2].map((r) =>
    r === scanRow % 3 && scanRow < 3 ? "~~~~~~~~~~~~~~~~~" : "                 ",
  );

  const ascii = `
        ${antenna}((•))
         \\   |
  .-----------------------.
  |  .-----------------.  |
  |  | ${screenRows[0]} |  |
  |  |   ${leftEye}         ${rightEye}   |  |
  |  | ${screenRows[1]} |  |
  |  |      ${mouth.padEnd(5)}      |  |
  |  | ${screenRows[2]} |  |
  |  '-----------------'  |
  |___ _______________ ___|
      /               \\
     /_________________\\
  `;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-70">
      <pre
        className="font-mono text-primary text-xs sm:text-sm md:text-lg leading-tight font-bold animate-pulse [animation-duration:4s]"
        style={{
          filter:
            "drop-shadow(0 0 8px color-mix(in srgb, var(--primary) 50%, transparent))",
        }}
      >
        {ascii}
      </pre>
    </div>
  );
}

export function AuthShell({
  children,
  variant = "welcome",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  const typingImpulseRef = useRef(0);
  const t = useTranslations();
  return (
    <TypingImpulseContext.Provider value={typingImpulseRef}>
      <AuthSplitLayout
        rightClassName="lg:w-[620px]"
        left={
          <>
            <AsciiMac />
            <ParticleField
              src={undefined as any}
              sampleStep={3}
              threshold={34}
              dotSize={1}
              renderScale={1}
              align="center"
              typingImpulseRef={typingImpulseRef}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(900px 600px at 50% 50%, transparent 45%, color-mix(in srgb, var(--background) 88%, transparent) 92%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-12 z-20">
              <div className="pointer-events-auto flex items-center gap-2 font-mono text-sm">
                <span className="font-bold text-3xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary-accent">Tawie</span>
              </div>
              {variant === "request-access" ? (
                <div className="max-w-md">
                  <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
                    Quiet onboarding
                  </div>
                  <p className="mt-3 font-heading text-xl leading-snug md:text-2xl">
                    A waitlist screen with a particle figure and a single soft
                    CTA — for invite-only entry points.
                  </p>
                </div>
              ) : variant === "onboarding" ? (
                <div className="max-w-md">
                  <div className="font-mono text-[11px] text-primary uppercase tracking-[0.3em]">
                    {t("onboarding.shellEyebrow")}
                  </div>
                  <p className="mt-3 font-heading text-xl leading-snug md:text-3xl font-light">
                    {withBrand(t("onboarding.shellWelcome"))}
                  </p>
                </div>
              ) : (
                <div className="max-w-md">
                  <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.3em]">
                    Sign-in design
                  </div>
                  <p className="mt-3 font-heading text-xl leading-snug md:text-2xl">
                    Split layout with a particle field on the left and a single
                    centered form on the right.
                  </p>
                </div>
              )}
            </div>
          </>
        }
        right={children}
      />
    </TypingImpulseContext.Provider>
  );
}
