"use client";

import { SVGProps } from "react";

/**
 * Star Trek Enterprise–inspired delta (Starfleet-style arrowhead) logo.
 * Use className="text-primary" or "text-primary-foreground" to control color.
 */
export function EnterpriseLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M24 2L46 44H2L24 2zm0 8.5L10 42h28L24 10.5z"
      />
    </svg>
  );
}
