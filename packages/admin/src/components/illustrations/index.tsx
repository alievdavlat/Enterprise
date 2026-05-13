"use client";

/**
 * Custom SVG illustrations — Phase 36 design pass.
 *
 * All illustrations are inline SVG so they:
 *   - work in dark/light mode (use currentColor + brand HSL vars)
 *   - scale crisp to any size (props.size)
 *   - ship in the JS bundle (no extra fetch)
 *   - tree-shake (only imported ones land in the page bundle)
 *
 * Design language: geometric, abstract, soft-glow gradients with the brand
 * violet → pink → blue triad. Avoids character art (that's where AI image
 * gen would beat me) — sticks to shape-based illustrations the SaaS dashboards
 * we admire (Linear, Vercel, Stripe) actually ship.
 */

import { type SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function defs(id: string) {
  return (
    <defs>
      <linearGradient id={`${id}-violet`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--brand-violet))" />
        <stop offset="100%" stopColor="hsl(var(--brand-pink))" />
      </linearGradient>
      <linearGradient id={`${id}-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--brand-blue))" />
        <stop offset="100%" stopColor="hsl(var(--brand-violet))" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(var(--brand-violet) / 0.40)" />
        <stop offset="100%" stopColor="hsl(var(--brand-violet) / 0)" />
      </radialGradient>
    </defs>
  );
}

/** Welcome / first-run — orbiting stars around a soft sun. */
export function IllustrationWelcome({ size = 200, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("welcome")}
      <circle cx="100" cy="100" r="80" fill="url(#welcome-glow)" />
      <circle cx="100" cy="100" r="34" fill="url(#welcome-violet)" />
      <circle cx="100" cy="100" r="34" stroke="hsl(var(--brand-violet) / 0.30)" strokeWidth="8" />
      {/* Orbit ring */}
      <ellipse cx="100" cy="100" rx="68" ry="20" stroke="hsl(var(--brand-violet) / 0.30)" strokeWidth="1.5" strokeDasharray="2 4" />
      {/* Satellites */}
      <circle cx="168" cy="100" r="6" fill="hsl(var(--brand-blue))" />
      <circle cx="32" cy="100" r="4" fill="hsl(var(--brand-pink))" />
      <circle cx="100" cy="36" r="3" fill="hsl(var(--brand-emerald))" />
      {/* Sparkles */}
      <path d="M48 52 L52 56 M52 52 L48 56" stroke="hsl(var(--brand-violet))" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M150 160 L154 164 M154 160 L150 164" stroke="hsl(var(--brand-pink))" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 150 L34 154 M34 150 L30 154" stroke="hsl(var(--brand-blue))" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** No data — empty box with floating particles. */
export function IllustrationNoData({ size = 180, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("nodata")}
      <ellipse cx="100" cy="170" rx="60" ry="6" fill="hsl(var(--brand-violet) / 0.12)" />
      {/* Box base */}
      <path d="M50 80 L150 80 L150 150 L50 150 Z" fill="hsl(var(--card))" stroke="hsl(var(--brand-violet) / 0.40)" strokeWidth="2" />
      {/* Box top open */}
      <path d="M50 80 L100 50 L150 80 L100 110 Z" fill="url(#nodata-violet)" opacity="0.20" stroke="hsl(var(--brand-violet) / 0.60)" strokeWidth="2" strokeLinejoin="round" />
      <line x1="100" y1="110" x2="100" y2="150" stroke="hsl(var(--brand-violet) / 0.30)" strokeWidth="2" strokeDasharray="3 3" />
      {/* Floating dots */}
      <circle cx="40" cy="50" r="3" fill="hsl(var(--brand-pink))" opacity="0.7" />
      <circle cx="160" cy="40" r="4" fill="hsl(var(--brand-blue))" opacity="0.7" />
      <circle cx="170" cy="100" r="2.5" fill="hsl(var(--brand-emerald))" opacity="0.7" />
      <circle cx="32" cy="100" r="3" fill="hsl(var(--brand-violet))" opacity="0.7" />
    </svg>
  );
}

/** Success — checkmark on a glowing disc. */
export function IllustrationSuccess({ size = 160, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("success")}
      <circle cx="100" cy="100" r="80" fill="url(#success-glow)" />
      <circle cx="100" cy="100" r="50" fill="hsl(var(--semantic-success) / 0.15)" stroke="hsl(var(--semantic-success) / 0.50)" strokeWidth="2" />
      <path d="M75 100 L92 117 L128 81" stroke="hsl(var(--semantic-success))" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Burst lines */}
      <g stroke="hsl(var(--semantic-success) / 0.50)" strokeWidth="2" strokeLinecap="round">
        <line x1="100" y1="20" x2="100" y2="34" />
        <line x1="100" y1="180" x2="100" y2="166" />
        <line x1="20" y1="100" x2="34" y2="100" />
        <line x1="180" y1="100" x2="166" y2="100" />
        <line x1="40" y1="40" x2="50" y2="50" />
        <line x1="160" y1="160" x2="150" y2="150" />
        <line x1="160" y1="40" x2="150" y2="50" />
        <line x1="40" y1="160" x2="50" y2="150" />
      </g>
    </svg>
  );
}

/** Building / construction — for "feature coming soon" panels. */
export function IllustrationBuilding({ size = 180, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("building")}
      {/* Glow */}
      <circle cx="100" cy="100" r="85" fill="url(#building-glow)" />
      {/* Layered blocks (Lego-stack feel) */}
      <rect x="60" y="120" width="80" height="22" rx="4" fill="url(#building-violet)" />
      <rect x="70" y="98" width="60" height="22" rx="4" fill="url(#building-blue)" />
      <rect x="80" y="76" width="40" height="22" rx="4" fill="hsl(var(--brand-pink))" />
      <rect x="90" y="54" width="20" height="22" rx="4" fill="hsl(var(--brand-emerald))" />
      {/* Tools / gear */}
      <circle cx="160" cy="60" r="14" fill="hsl(var(--brand-violet) / 0.20)" stroke="hsl(var(--brand-violet))" strokeWidth="2" />
      <circle cx="160" cy="60" r="4" fill="hsl(var(--brand-violet))" />
      <g stroke="hsl(var(--brand-violet))" strokeWidth="2" strokeLinecap="round">
        <line x1="160" y1="46" x2="160" y2="42" />
        <line x1="160" y1="78" x2="160" y2="74" />
        <line x1="146" y1="60" x2="142" y2="60" />
        <line x1="174" y1="60" x2="178" y2="60" />
      </g>
      {/* Floor */}
      <ellipse cx="100" cy="160" rx="70" ry="6" fill="hsl(var(--brand-violet) / 0.12)" />
    </svg>
  );
}

/** Error / something went wrong — broken connection. */
export function IllustrationError({ size = 180, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("error")}
      <circle cx="100" cy="100" r="80" fill="hsl(var(--semantic-danger) / 0.08)" />
      <circle cx="60" cy="100" r="20" fill="hsl(var(--semantic-danger) / 0.15)" stroke="hsl(var(--semantic-danger) / 0.40)" strokeWidth="2" />
      <circle cx="140" cy="100" r="20" fill="hsl(var(--semantic-danger) / 0.15)" stroke="hsl(var(--semantic-danger) / 0.40)" strokeWidth="2" />
      {/* Broken jagged line connecting them */}
      <path d="M80 100 L92 92 L98 108 L108 92 L120 100" stroke="hsl(var(--semantic-danger))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M58 100 L62 100 M138 100 L142 100" stroke="hsl(var(--semantic-danger))" strokeWidth="3" strokeLinecap="round" />
      {/* Exclamation hover */}
      <circle cx="100" cy="50" r="3" fill="hsl(var(--semantic-danger))" />
      <line x1="100" y1="30" x2="100" y2="44" stroke="hsl(var(--semantic-danger))" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Code builder — nested abstract shapes representing layered code/blocks. */
export function IllustrationCode({ size = 180, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("code")}
      <circle cx="100" cy="100" r="80" fill="url(#code-glow)" />
      {/* Outer terminal-ish frame */}
      <rect x="40" y="50" width="120" height="100" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--brand-violet) / 0.40)" strokeWidth="2" />
      {/* Title bar dots */}
      <circle cx="54" cy="66" r="3" fill="hsl(var(--semantic-danger))" />
      <circle cx="66" cy="66" r="3" fill="hsl(var(--semantic-warning))" />
      <circle cx="78" cy="66" r="3" fill="hsl(var(--semantic-success))" />
      {/* Code lines (abstract bars) */}
      <rect x="56" y="86" width="50" height="6" rx="3" fill="hsl(var(--brand-violet))" opacity="0.80" />
      <rect x="56" y="100" width="80" height="6" rx="3" fill="hsl(var(--brand-blue))" opacity="0.60" />
      <rect x="68" y="114" width="34" height="6" rx="3" fill="hsl(var(--brand-pink))" opacity="0.60" />
      <rect x="68" y="128" width="56" height="6" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.30" />
      {/* Floating cursor / play indicator */}
      <circle cx="160" cy="110" r="14" fill="url(#code-violet)" />
      <path d="M156 104 L168 110 L156 116 Z" fill="white" />
    </svg>
  );
}

/** Search — magnifier with floating result shapes. */
export function IllustrationSearch({ size = 180, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("search")}
      <circle cx="100" cy="100" r="80" fill="url(#search-glow)" />
      <circle cx="85" cy="85" r="34" stroke="url(#search-violet)" strokeWidth="6" />
      <line x1="110" y1="110" x2="138" y2="138" stroke="url(#search-violet)" strokeWidth="8" strokeLinecap="round" />
      {/* Result shapes scattered */}
      <rect x="40" y="40" width="14" height="4" rx="2" fill="hsl(var(--brand-pink))" opacity="0.6" />
      <rect x="40" y="50" width="22" height="4" rx="2" fill="hsl(var(--brand-blue))" opacity="0.6" />
      <rect x="140" y="50" width="20" height="4" rx="2" fill="hsl(var(--brand-emerald))" opacity="0.6" />
      <rect x="140" y="60" width="14" height="4" rx="2" fill="hsl(var(--brand-violet))" opacity="0.6" />
      <rect x="40" y="155" width="18" height="4" rx="2" fill="hsl(var(--brand-blue))" opacity="0.6" />
      <rect x="40" y="165" width="26" height="4" rx="2" fill="hsl(var(--brand-violet))" opacity="0.6" />
    </svg>
  );
}

/** Generic decorative "spark" — small accent for tiles. */
export function Spark({ size = 16, ...rest }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" {...rest}>
      <path d="M8 2 L9.5 6.5 L14 8 L9.5 9.5 L8 14 L6.5 9.5 L2 8 L6.5 6.5 Z" fill="url(#spark-grad)" />
      <defs>
        <linearGradient id="spark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--brand-violet))" />
          <stop offset="100%" stopColor="hsl(var(--brand-pink))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Brand logo glyph — abstract layered hexagon. */
export function BrandGlyph({ size = 32, ...rest }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" {...rest}>
      <defs>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--brand-violet))" />
          <stop offset="100%" stopColor="hsl(var(--brand-pink))" />
        </linearGradient>
      </defs>
      <path d="M16 3 L27 9 L27 21 L16 27 L5 21 L5 9 Z" fill="url(#brand-grad)" />
      <path d="M16 10 L22 13.5 L22 20.5 L16 24 L10 20.5 L10 13.5 Z" fill="hsl(var(--background))" opacity="0.95" />
      <path d="M16 14 L19 15.7 L19 19.3 L16 21 L13 19.3 L13 15.7 Z" fill="url(#brand-grad)" />
    </svg>
  );
}
