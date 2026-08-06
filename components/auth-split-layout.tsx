import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

type AuthSplitLayoutProps = {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  frameClassName?: string;
  leftClassName?: string;
  rightClassName?: string;
};

export function AuthSplitLayout({
  left,
  right,
  className,
  frameClassName,
  leftClassName,
  rightClassName,
}: AuthSplitLayoutProps) {
  return (
    <div
      className={cn(
        "relative h-svh w-full overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      <ThemeToggle className="absolute top-6 right-6 z-30" />
      <div
        className={cn(
          "relative flex h-full w-full",
          frameClassName,
        )}
      >
        <div
          className={cn(
            "relative hidden flex-1 overflow-hidden border-border/60 border-r lg:block",
            leftClassName,
          )}
        >
          {left}
        </div>
        <div
          className={cn(
            "relative flex w-full flex-col items-center justify-center overflow-y-auto px-6 py-10 lg:w-[560px] lg:px-14",
            rightClassName,
          )}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
