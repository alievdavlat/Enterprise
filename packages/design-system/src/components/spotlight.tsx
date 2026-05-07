"use client";

/**
 * Spotlight — large soft elliptical glow, fading & drifting, used as a hero accent.
 * Inspired by ui.aceternity.com.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface SpotlightProps extends React.SVGAttributes<SVGSVGElement> {
  fill?: string;
}

export function Spotlight({
  className,
  fill = "white",
  ...props
}: SpotlightProps) {
  return (
    <svg
      className={cn(
        "ds-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0",
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
      {...props}
    >
      <g filter="url(#filter)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="151"
            result="effect1_foregroundBlur_1065_8"
          />
        </filter>
      </defs>
      <style>{`
        @keyframes ds-spotlight-in {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          100% { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        .ds-spotlight {
          animation: ds-spotlight-in 1.5s ease 0.75s forwards;
        }
      `}</style>
    </svg>
  );
}
