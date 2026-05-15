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

/* ──────────────────────────────────────────────────────────────────── */
/* Dialog illustrations — bigger (default 140px), animated via CSS      */
/* utility classes attached to sub-groups (see globals.css):            */
/*   .illo-float       — gentle y-axis float                            */
/*   .illo-pulse-glow  — radial glow breathes                           */
/*   .illo-spin-slow   — full rotation, 12s                             */
/*   .illo-wiggle      — tiny back-and-forth tilt                       */
/* ──────────────────────────────────────────────────────────────────── */

/** Delete confirm — trash bin with rising dust particles. */
export function IllustrationDelete({ size = 140, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      <defs>
        <linearGradient id="del-rose" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--semantic-danger) / 0.80)" />
          <stop offset="100%" stopColor="hsl(var(--brand-pink))" />
        </linearGradient>
        <radialGradient id="del-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--semantic-danger) / 0.30)" />
          <stop offset="100%" stopColor="hsl(var(--semantic-danger) / 0)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#del-glow)" className="illo-pulse-glow" />
      <g className="illo-wiggle origin-bottom">
        {/* Bin body */}
        <rect x="68" y="88" width="64" height="64" rx="6" fill="hsl(var(--card))" stroke="url(#del-rose)" strokeWidth="3" />
        {/* Bin lid */}
        <rect x="60" y="76" width="80" height="10" rx="3" fill="url(#del-rose)" />
        {/* Handle */}
        <path d="M88 76 L88 66 L112 66 L112 76" stroke="url(#del-rose)" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Lines inside */}
        <line x1="86" y1="104" x2="86" y2="138" stroke="hsl(var(--semantic-danger) / 0.50)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="100" y1="104" x2="100" y2="138" stroke="hsl(var(--semantic-danger) / 0.50)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="114" y1="104" x2="114" y2="138" stroke="hsl(var(--semantic-danger) / 0.50)" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* Floating particles */}
      <g className="illo-float">
        <circle cx="50" cy="60" r="2.5" fill="hsl(var(--semantic-danger) / 0.70)" />
        <circle cx="150" cy="58" r="2" fill="hsl(var(--brand-pink) / 0.70)" />
        <circle cx="40" cy="100" r="1.8" fill="hsl(var(--semantic-danger) / 0.50)" />
        <circle cx="162" cy="106" r="2.2" fill="hsl(var(--brand-pink) / 0.60)" />
      </g>
    </svg>
  );
}

/** Create new — sparkling plus icon. */
export function IllustrationCreate({ size = 140, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("create")}
      <circle cx="100" cy="100" r="80" fill="url(#create-glow)" className="illo-pulse-glow" />
      <g className="illo-float">
        <circle cx="100" cy="100" r="44" fill="url(#create-violet)" />
        <line x1="100" y1="78" x2="100" y2="122" stroke="white" strokeWidth="6" strokeLinecap="round" />
        <line x1="78" y1="100" x2="122" y2="100" stroke="white" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* Stars */}
      <g className="illo-spin-slow origin-center">
        <path d="M40 50 L43 58 L51 60 L43 62 L40 70 L37 62 L29 60 L37 58 Z" fill="hsl(var(--brand-pink))" />
        <path d="M160 60 L162 65 L167 67 L162 69 L160 74 L158 69 L153 67 L158 65 Z" fill="hsl(var(--brand-blue))" />
        <path d="M50 150 L52 155 L57 157 L52 159 L50 164 L48 159 L43 157 L48 155 Z" fill="hsl(var(--brand-emerald))" />
      </g>
    </svg>
  );
}

/** Upload — cloud with rising arrow. */
export function IllustrationUpload({ size = 140, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("upload")}
      <circle cx="100" cy="100" r="80" fill="url(#upload-glow)" className="illo-pulse-glow" />
      {/* Cloud */}
      <path
        d="M58 120 C50 120 44 114 44 106 C44 98 50 92 58 92 C58 80 68 70 80 70 C90 70 98 76 102 84 C106 80 112 78 118 78 C130 78 140 88 140 100 C148 100 154 106 154 114 C154 120 148 124 142 124 L58 124 C58 124 58 122 58 120 Z"
        fill="hsl(var(--card))"
        stroke="url(#upload-blue)"
        strokeWidth="2.5"
      />
      <g className="illo-float">
        {/* Arrow shaft */}
        <line x1="100" y1="148" x2="100" y2="100" stroke="url(#upload-violet)" strokeWidth="6" strokeLinecap="round" />
        {/* Arrow head */}
        <path d="M84 116 L100 100 L116 116" stroke="url(#upload-violet)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      {/* Floor */}
      <ellipse cx="100" cy="170" rx="56" ry="5" fill="hsl(var(--brand-violet) / 0.12)" />
    </svg>
  );
}

/** Confirm / question — speech bubble with ? */
export function IllustrationConfirm({ size = 140, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("confirm")}
      <circle cx="100" cy="100" r="80" fill="url(#confirm-glow)" className="illo-pulse-glow" />
      <g className="illo-wiggle origin-center">
        {/* Speech bubble */}
        <path
          d="M50 70 Q50 56 64 56 L136 56 Q150 56 150 70 L150 120 Q150 134 136 134 L106 134 L90 152 L92 134 L64 134 Q50 134 50 120 Z"
          fill="hsl(var(--card))"
          stroke="url(#confirm-violet)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Question mark */}
        <path
          d="M87 82 Q87 70 100 70 Q113 70 113 82 Q113 90 105 94 Q100 96 100 104"
          stroke="url(#confirm-violet)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="100" cy="118" r="3.5" fill="hsl(var(--brand-violet))" />
      </g>
    </svg>
  );
}

/** Key / auth — key with halo for token + provider dialogs. */
export function IllustrationKey({ size = 140, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("key")}
      <circle cx="100" cy="100" r="80" fill="url(#key-glow)" className="illo-pulse-glow" />
      <g className="illo-float origin-center">
        {/* Key head */}
        <circle cx="80" cy="100" r="22" fill="hsl(var(--card))" stroke="url(#key-violet)" strokeWidth="4" />
        <circle cx="80" cy="100" r="7" fill="url(#key-violet)" />
        {/* Key shaft */}
        <line x1="100" y1="100" x2="148" y2="100" stroke="url(#key-violet)" strokeWidth="6" strokeLinecap="round" />
        {/* Teeth */}
        <line x1="132" y1="100" x2="132" y2="112" stroke="url(#key-violet)" strokeWidth="5" strokeLinecap="round" />
        <line x1="142" y1="100" x2="142" y2="108" stroke="url(#key-violet)" strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* Sparkle */}
      <g className="illo-spin-slow origin-center">
        <circle cx="48" cy="60" r="2.5" fill="hsl(var(--brand-pink))" />
        <circle cx="156" cy="68" r="2" fill="hsl(var(--brand-blue))" />
      </g>
    </svg>
  );
}

/** Database / schema — three layered stacked rings. */
export function IllustrationDatabase({ size = 140, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("db")}
      <circle cx="100" cy="100" r="80" fill="url(#db-glow)" className="illo-pulse-glow" />
      <g className="illo-float origin-center">
        {/* Stack of disc rings */}
        <ellipse cx="100" cy="140" rx="50" ry="14" fill="hsl(var(--card))" stroke="url(#db-violet)" strokeWidth="2.5" />
        <ellipse cx="100" cy="115" rx="50" ry="14" fill="hsl(var(--card))" stroke="url(#db-violet)" strokeWidth="2.5" />
        <ellipse cx="100" cy="90" rx="50" ry="14" fill="hsl(var(--card))" stroke="url(#db-violet)" strokeWidth="2.5" />
        <ellipse cx="100" cy="65" rx="50" ry="14" fill="url(#db-violet)" opacity="0.85" stroke="url(#db-violet)" strokeWidth="2.5" />
        {/* Connection lines between discs */}
        <line x1="50" y1="65" x2="50" y2="140" stroke="url(#db-violet)" strokeWidth="2.5" />
        <line x1="150" y1="65" x2="150" y2="140" stroke="url(#db-violet)" strokeWidth="2.5" />
        {/* Indicator dot on top */}
        <circle cx="100" cy="65" r="3.5" fill="hsl(var(--brand-emerald))" />
      </g>
    </svg>
  );
}

/** Document / file — page with corner fold and floating dots. */
export function IllustrationDocument({ size = 140, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      {defs("doc")}
      <circle cx="100" cy="100" r="80" fill="url(#doc-glow)" className="illo-pulse-glow" />
      <g className="illo-float origin-center">
        {/* Document body */}
        <path
          d="M60 50 L130 50 L150 70 L150 160 L60 160 Z"
          fill="hsl(var(--card))"
          stroke="url(#doc-violet)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Corner fold */}
        <path d="M130 50 L130 70 L150 70 Z" fill="url(#doc-violet)" opacity="0.30" stroke="url(#doc-violet)" strokeWidth="3" strokeLinejoin="round" />
        {/* Lines */}
        <line x1="74" y1="88" x2="136" y2="88" stroke="hsl(var(--brand-violet) / 0.50)" strokeWidth="3" strokeLinecap="round" />
        <line x1="74" y1="104" x2="120" y2="104" stroke="hsl(var(--brand-blue) / 0.50)" strokeWidth="3" strokeLinecap="round" />
        <line x1="74" y1="120" x2="132" y2="120" stroke="hsl(var(--brand-pink) / 0.50)" strokeWidth="3" strokeLinecap="round" />
        <line x1="74" y1="136" x2="106" y2="136" stroke="hsl(var(--muted-foreground) / 0.30)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Warning — alert triangle with focus glow. */
export function IllustrationWarning({ size = 140, ...rest }: Props) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" {...rest}>
      <defs>
        <linearGradient id="warn-amber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--semantic-warning))" />
          <stop offset="100%" stopColor="hsl(var(--brand-pink))" />
        </linearGradient>
        <radialGradient id="warn-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--semantic-warning) / 0.30)" />
          <stop offset="100%" stopColor="hsl(var(--semantic-warning) / 0)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#warn-glow)" className="illo-pulse-glow" />
      <g className="illo-wiggle origin-center">
        {/* Triangle */}
        <path
          d="M100 50 L156 146 L44 146 Z"
          fill="hsl(var(--card))"
          stroke="url(#warn-amber)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Exclamation */}
        <line x1="100" y1="84" x2="100" y2="118" stroke="hsl(var(--semantic-warning))" strokeWidth="6" strokeLinecap="round" />
        <circle cx="100" cy="132" r="4" fill="hsl(var(--semantic-warning))" />
      </g>
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

/**
 * Brand logo — abstract starship silhouette inspired by the NCC-1701
 * profile (saucer + secondary hull + twin warp nacelles), simplified to a
 * mark that reads at 16px and scales clean to 256px. Uses currentColor so
 * the host can paint it any single colour; the inset accent line uses
 * brand-violet for a hint of warmth without becoming gaudy.
 */
export function BrandGlyph({ size = 32, ...rest }: Props) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" stroke="none" {...rest}>
      {/* Saucer (top disc) */}
      <ellipse cx="32" cy="24" rx="22" ry="6" fill="currentColor" />
      {/* Saucer accent — slim under-ring */}
      <ellipse cx="32" cy="26.5" rx="22" ry="1.5" fill="currentColor" opacity="0.55" />
      {/* Connecting strut from saucer to engineering hull */}
      <path d="M30 28 L31 36 L33 36 L34 28 Z" fill="currentColor" opacity="0.85" />
      {/* Engineering hull (elongated capsule) */}
      <rect x="22" y="36" width="20" height="6" rx="3" fill="currentColor" />
      <circle cx="42" cy="39" r="2" fill="currentColor" opacity="0.7" />
      {/* Nacelles — twin warp engines on outriggers */}
      <path d="M10 30 L12 30 L18 38 L16 38 Z" fill="currentColor" opacity="0.80" />
      <path d="M54 30 L52 30 L46 38 L48 38 Z" fill="currentColor" opacity="0.80" />
      <rect x="6"  y="36" width="14" height="4" rx="2" fill="currentColor" />
      <rect x="44" y="36" width="14" height="4" rx="2" fill="currentColor" />
      {/* Bussard collectors (front of nacelles) — single brand accent */}
      <circle cx="7"  cy="38" r="2" fill="hsl(var(--brand-violet))" />
      <circle cx="57" cy="38" r="2" fill="hsl(var(--brand-violet))" />
    </svg>
  );
}

/**
 * Brand wordmark — glyph + "Enterprise" label, horizontal. Drop into the
 * sidebar header / login splash anywhere a one-line brand mark is needed.
 */
export function BrandWordmark({ size = 28, ...rest }: Props) {
  return (
    <svg viewBox="0 0 220 36" width={size * 6} height={size} fill="none" {...rest}>
      <g transform="translate(0,2)">
        {/* Use the same primitives as BrandGlyph at fixed coords. */}
        <ellipse cx="16" cy="14" rx="13" ry="3.5" fill="currentColor" />
        <ellipse cx="16" cy="16" rx="13" ry="1" fill="currentColor" opacity="0.55" />
        <path d="M15 17 L15.6 23 L16.4 23 L17 17 Z" fill="currentColor" opacity="0.85" />
        <rect x="9" y="22" width="14" height="4" rx="2" fill="currentColor" />
        <rect x="2" y="22" width="9" height="2.5" rx="1.25" fill="currentColor" opacity="0.85" />
        <rect x="21" y="22" width="9" height="2.5" rx="1.25" fill="currentColor" opacity="0.85" />
        <circle cx="3"  cy="23.25" r="1.2" fill="hsl(var(--brand-violet))" />
        <circle cx="29" cy="23.25" r="1.2" fill="hsl(var(--brand-violet))" />
      </g>
      <text
        x="44"
        y="24"
        fontFamily="ui-sans-serif, system-ui"
        fontSize="18"
        fontWeight="600"
        letterSpacing="-0.02em"
        fill="currentColor">
        Enterprise
      </text>
    </svg>
  );
}
