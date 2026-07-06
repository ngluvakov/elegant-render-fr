/**
 * BeforeAfterShowcase — showcase-sized before/after comparison. Since the
 * international redesign this is a thin wrapper around `BeforeAfterSlider`
 * (docs/design-handoff behavior spec: demo swipe on viewport entry, 135°
 * cursor tracking, scroll-driven on touch, reduced-motion static 50) so
 * every marketing surface shares one slider implementation.
 *
 * Kept for API compatibility with earlier showcase call sites; new code
 * should import `BeforeAfterSlider` directly.
 */
"use client";

import type { ReactNode } from "react";
import { BeforeAfterSlider } from "@/components/marketing/before-after-slider";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  beforeAlt?: string;
  afterAlt?: string;
  sizes?: string;
  className?: string;
  fallback?: ReactNode;
  children?: ReactNode;
};

export function BeforeAfterShowcase({
  beforeSrc,
  afterSrc,
  alt,
  beforeAlt,
  afterAlt,
  sizes = "(max-width: 768px) 100vw, 1200px",
  className,
  fallback,
  children,
}: Props) {
  return (
    <BeforeAfterSlider
      beforeSrc={beforeSrc}
      afterSrc={afterSrc}
      alt={alt}
      beforeAlt={beforeAlt}
      afterAlt={afterAlt}
      sizes={sizes}
      className={className}
      hideLabels={Boolean(children)}
    >
      {fallback}
      {children}
    </BeforeAfterSlider>
  );
}
