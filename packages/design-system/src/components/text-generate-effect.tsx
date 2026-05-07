"use client";

/**
 * TextGenerateEffect — words appear one by one with a fade-up animation.
 * Inspired by ui.aceternity.com.
 *
 * CSS-only implementation — no motion lib needed.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  delayPerWord?: number;
}

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
  delayPerWord = 0.18,
}: TextGenerateEffectProps) {
  const tokens = React.useMemo(() => words.split(" "), [words]);

  return (
    <span className={cn("font-bold inline-block leading-snug", className)}>
      {tokens.map((w, i) => (
        <span
          key={i}
          className="ds-tge-word inline-block"
          style={{
            animationDelay: `${i * delayPerWord}s`,
            animationDuration: `${duration}s`,
            filter: filter ? "blur(10px)" : undefined,
          }}
        >
          {w}
          {i < tokens.length - 1 ? " " : ""}
        </span>
      ))}
      <style>{`
        @keyframes ds-tge-in {
          0%   { opacity: 0; transform: translateY(8px); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0);   filter: blur(0); }
        }
        .ds-tge-word {
          opacity: 0;
          animation-name: ds-tge-in;
          animation-fill-mode: forwards;
          animation-timing-function: ease;
        }
      `}</style>
    </span>
  );
}
