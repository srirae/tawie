import type { ReactNode, RefObject } from "react";
import { createContext, useContext, useRef } from "react";
import { ParticleField } from "@/components/particle-field";
import { AuthSplitLayout } from "@/components/auth-split-layout";


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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 4000 + 2000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(blinkInterval);
    };
  }, []);

  let leftEye = "O";
  let rightEye = "O";
  let mouth = "\\___/";

  if (isBlinking) {
    leftEye = "-";
    rightEye = "-";
    mouth = "___";
  } else {
    if (mousePos.x < 0.4) { leftEye = "o"; rightEye = "O"; }
    else if (mousePos.x > 0.6) { leftEye = "O"; rightEye = "o"; }
    else { leftEye = "O"; rightEye = "O"; }
    
    if (mousePos.y < 0.3) mouth = " O ";
    else if (mousePos.y > 0.7) mouth = "___";
  }

  const ascii = `
  .-----------------------.
  |  .-----------------.  |
  |  |                 |  |
  |  |   ${leftEye}         ${rightEye}   |  |
  |  |                 |  |
  |  |      ${mouth.padEnd(5)}      |  |
  |  '-----------------'  |
  |___ _______________ ___|
      /               \\
     /_________________\\
  `;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-70">
      <pre className="font-mono text-primary text-xs sm:text-sm md:text-lg leading-tight font-bold drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
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
                <span className="font-bold text-3xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Tawie</span>
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
                    First steps
                  </div>
                  <p className="mt-3 font-heading text-xl leading-snug md:text-3xl font-light">
                    Welcome to <span className="font-semibold text-primary">Tawie</span>, your disposable browser sandbox. Follow these steps to get started securely.
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
