"use client";

/**
 * PaymentTrustBadges — Bank-mandated brand badges for the checkout
 * footer. EPM standard 2.2 requires linking the official Visa Secure
 * and Mastercard ID Check pages alongside the issuing bank (Banca
 * Intesa).
 *
 * Brand assets live in /public/branding/payments/. While those assets
 * are absent, each badge falls back to a styled text chip so the page
 * never shows browser broken-image icons. The fallback is enabled
 * with a per-badge onError handler — once you drop the official SVGs
 * in place, the images take over automatically without code changes.
 *
 * Used by: footer (site-wide) and the checkout payment step.
 */

import { useState } from "react";

type Badge = {
  label: string;
  src: string;
  href: string;
  ariaLabel: string;
};

const BADGES: Badge[] = [
  {
    label: "Visa",
    src: "/branding/payments/visa.svg",
    href: "https://rs.visa.com/pay-with-visa/security-and-assistance/protected-everywhere.html",
    ariaLabel: "Visa kartice",
  },
  {
    label: "Visa Secure",
    src: "/branding/payments/visa-secure.svg",
    href: "https://rs.visa.com/pay-with-visa/security-and-assistance/protected-everywhere.html",
    ariaLabel: "Visa Secure — 3D Secure autentifikacija",
  },
  {
    label: "Mastercard",
    src: "/branding/payments/mastercard.svg",
    href: "https://www.mastercard.rs/sr-rs/korisnici/pronadite-karticu.html",
    ariaLabel: "Mastercard kartice",
  },
  {
    label: "Mastercard ID Check",
    src: "/branding/payments/mastercard-id-check.svg",
    href: "https://www.mastercard.rs/sr-rs/korisnici/pronadite-karticu.html",
    ariaLabel: "Mastercard ID Check — 3D Secure autentifikacija",
  },
  {
    label: "Banca Intesa",
    src: "/branding/payments/banca-intesa.svg",
    href: "https://www.bancaintesa.rs",
    ariaLabel: "Banca Intesa AD Beograd — payment gateway",
  },
];

export type PaymentTrustBadgesProps = {
  className?: string;
  size?: "sm" | "md";
};

export function PaymentTrustBadges({
  className = "",
  size = "md",
}: PaymentTrustBadgesProps) {
  const itemHeight = size === "sm" ? 18 : 22;
  return (
    <ul
      className={`flex flex-wrap items-center gap-2 ${className}`}
      aria-label="Prihvaćeni načini plaćanja i sigurnosni standardi"
    >
      {BADGES.map((badge) => (
        <li key={badge.label}>
          <BadgeLink badge={badge} height={itemHeight} />
        </li>
      ))}
    </ul>
  );
}

function BadgeLink({ badge, height }: { badge: Badge; height: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <a
      href={badge.href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center justify-center rounded-md border border-border/40 bg-card/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-foreground/70 transition hover:border-accent/40 hover:text-foreground"
      aria-label={badge.ariaLabel}
      title={badge.ariaLabel}
      style={{ minHeight: height + 8 }}
    >
      {imgFailed ? (
        <span aria-hidden>{badge.label}</span>
      ) : (
        <img
          src={badge.src}
          alt={badge.label}
          loading="lazy"
          className="w-auto object-contain"
          style={{ height }}
          onError={() => setImgFailed(true)}
        />
      )}
    </a>
  );
}
