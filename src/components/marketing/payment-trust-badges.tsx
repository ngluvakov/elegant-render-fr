"use client";

/**
 * PaymentTrustBadges — BI EPM §2.2 three-group badge bar.
 *
 * Group 1 (acceptance): Visa, Mastercard, Maestro, DinaCard.
 * Group 2 (security):   Mastercard ID Check, Visa Secure, DinaCard Secure
 *                        — linked to official programme pages per EPM §2.2.
 * Group 3 (issuer):     Banca Intesa AD Beograd.
 *
 * Assets live in /public/branding/payments/. On image load error the
 * alt text is rendered as plain text; no decorative chip fallback.
 *
 * Size variants:
 *   default — py-3 px-6, logo h-5, between-group gap-8.
 *   sm      — py-2 px-4, logo h-4, between-group gap-6.
 */

import Image from "next/image";

type Size = "default" | "sm";

export type PaymentTrustBadgesProps = {
  className?: string;
  size?: Size;
};

type Logo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  href?: string;
  ariaLabel?: string;
};

const ACCEPTANCE: Logo[] = [
  {
    src: "/branding/payments/visa.png",
    alt: "Visa",
    width: 60,
    height: 20,
  },
  {
    src: "/branding/payments/mastercard.svg",
    alt: "Mastercard",
    width: 32,
    height: 20,
  },
  {
    src: "/branding/payments/maestro.svg",
    alt: "Maestro",
    width: 32,
    height: 20,
  },
  {
    src: "/branding/payments/dinacard.png",
    alt: "DinaCard",
    width: 20,
    height: 20,
  },
];

const SECURITY: Logo[] = [
  {
    src: "/branding/payments/mastercard-id-check.svg",
    alt: "Mastercard ID Check",
    width: 56,
    height: 20,
    href: "https://www.mastercard.rs/sr-rs/korisnici/pronadite-karticu.html",
    ariaLabel: "Mastercard ID Check — 3D Secure autentifikacija",
  },
  {
    src: "/branding/payments/visa-secure.png",
    alt: "Visa Secure",
    width: 56,
    height: 20,
    href: "https://rs.visa.com/pay-with-visa/security-and-assistance/protected-everywhere.html",
    ariaLabel: "Visa Secure — 3D Secure autentifikacija",
  },
  {
    src: "/branding/payments/dinacard-secure.png",
    alt: "DinaCard Secure",
    width: 56,
    height: 20,
    href: "https://www.dinacard.nbs.rs/",
    ariaLabel: "DinaCard Secure — 3D Secure autentifikacija",
  },
];

const ISSUER: Logo[] = [
  {
    src: "/branding/payments/banca-intesa.png",
    alt: "Banca Intesa",
    width: 80,
    height: 20,
    href: "https://www.bancaintesa.rs/",
    ariaLabel: "Banca Intesa AD Beograd — payment gateway",
  },
];

function LogoImg({
  logo,
  height,
}: {
  logo: Logo;
  height: number;
}) {
  const scale = height / logo.height;
  const w = Math.round(logo.width * scale);

  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={w}
      height={height}
      className="object-contain"
      style={{ height, width: "auto" }}
    />
  );
}

function LogoItem({ logo, height }: { logo: Logo; height: number }) {
  if (logo.href) {
    return (
      <a
        href={logo.href}
        target="_blank"
        rel="noreferrer"
        aria-label={logo.ariaLabel ?? logo.alt}
        title={logo.ariaLabel ?? logo.alt}
        className="inline-flex items-center"
      >
        <LogoImg logo={logo} height={height} />
      </a>
    );
  }
  return <LogoImg logo={logo} height={height} />;
}

function Divider() {
  return <span className="w-px h-5 bg-border/30 flex-shrink-0" aria-hidden="true" />;
}

export function PaymentTrustBadges({
  className = "",
  size = "default",
}: PaymentTrustBadgesProps) {
  const isSm = size === "sm";
  const logoH = isSm ? 16 : 20;
  const padY = isSm ? "py-2" : "py-3";
  const padX = isSm ? "px-4" : "px-6";
  const betweenGap = isSm ? "gap-6" : "gap-8";

  return (
    <div
      className={`bg-background rounded-xl ring-1 ring-border/40 ${padY} ${padX} flex flex-row flex-wrap items-center ${betweenGap} ${className}`}
      aria-label="Prihvaćeni načini plaćanja i sigurnosni standardi"
    >
      {/* Group 1: Acceptance */}
      <div className="flex items-center gap-2">
        {ACCEPTANCE.map((logo) => (
          <LogoItem key={logo.alt} logo={logo} height={logoH} />
        ))}
      </div>

      <Divider />

      {/* Group 2: Security programmes */}
      <div className="flex items-center gap-2">
        {SECURITY.map((logo) => (
          <LogoItem key={logo.alt} logo={logo} height={logoH} />
        ))}
      </div>

      <Divider />

      {/* Group 3: Issuer */}
      <div className="flex items-center gap-2">
        {ISSUER.map((logo) => (
          <LogoItem key={logo.alt} logo={logo} height={logoH} />
        ))}
      </div>
    </div>
  );
}
