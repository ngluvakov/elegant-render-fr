"use client";

/**
 * PaymentTrustBadges — Banca Intesa EPM v3.5 §2.2 badge bar.
 *
 * Layout (single centered row, wraps on narrow screens):
 *
 *   [ Group A — acceptance ]   ⟵b⟶   [ Banca Intesa ]   ⟵b⟶   [ Group B — programmes ]
 *
 * Group A (acceptance): Visa, Mastercard, Maestro, DinaCard, American Express.
 * Centre separator:     Banca Intesa AD Beograd — the issuer logo sits between
 *                        the two groups (per §2.2 reference art "primer korektnog
 *                        brendiranja vodoravno").
 * Group B (programmes): Visa Secure, Mastercard ID Check, DinaCard Secure,
 *                        American Express SafeKey — linked to official programme
 *                        pages per EPM §2.2.
 *
 * Spacing follows the §2.2 clear-space rule b >= 4a: within-group gap a = gap-2,
 * between-group gap b = gap-8 (default) / gap-6 (sm). Groups are separated by
 * clear space + the centre logo, not by rules. All marks sit on a plain ivory
 * ground (bg-background), as the guideline mandates.
 *
 * Assets live in /public/branding/payments/ (high-quality bank set). On image
 * load error the alt text is rendered as plain text; no decorative fallback.
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

// width/height encode each asset's intrinsic aspect ratio (height normalised to
// 20); LogoImg rescales to the rendered height.
const ACCEPTANCE: Logo[] = [
  {
    src: "/branding/payments/visa.png",
    alt: "Visa",
    width: 42,
    height: 20,
  },
  {
    src: "/branding/payments/mastercard.png",
    alt: "Mastercard",
    width: 24,
    height: 20,
  },
  {
    src: "/branding/payments/maestro.png",
    alt: "Maestro",
    width: 24,
    height: 20,
  },
  {
    src: "/branding/payments/dinacard.png",
    alt: "DinaCard",
    width: 43,
    height: 20,
  },
  {
    src: "/branding/payments/amex.png",
    alt: "American Express",
    width: 20,
    height: 20,
  },
];

const BANCA_INTESA: Logo = {
  src: "/branding/payments/banca-intesa.png",
  alt: "Banca Intesa",
  width: 100,
  height: 20,
  href: "https://www.bancaintesa.rs/",
  ariaLabel: "Banca Intesa AD Beograd — payment gateway",
};

const PROGRAMS: Logo[] = [
  {
    src: "/branding/payments/visa-secure.png",
    alt: "Visa Secure",
    width: 20,
    height: 20,
    href: "https://rs.visa.com/pay-with-visa/security-and-assistance/protected-everywhere.html",
    ariaLabel: "Visa Secure — 3D Secure autentifikacija",
  },
  {
    src: "/branding/payments/mastercard-id-check.png",
    alt: "Mastercard ID Check",
    width: 70,
    height: 20,
    href: "https://www.mastercard.rs/sr-rs/korisnici/pronadite-karticu.html",
    ariaLabel: "Mastercard ID Check — 3D Secure autentifikacija",
  },
  {
    src: "/branding/payments/dinacard-secure.png",
    alt: "DinaCard Secure",
    width: 30,
    height: 20,
    href: "https://www.dinacard.nbs.rs/",
    ariaLabel: "DinaCard Secure — 3D Secure autentifikacija",
  },
  {
    src: "/branding/payments/amex-safekey.png",
    alt: "American Express SafeKey",
    width: 81,
    height: 20,
    href: "https://www.americanexpress.com/en-us/benefits/safekey/",
    ariaLabel: "American Express SafeKey — 3D Secure autentifikacija",
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
      className={`bg-background rounded-xl ring-1 ring-border/40 ${padY} ${padX} flex flex-row flex-wrap items-center justify-center ${betweenGap} ${className}`}
      aria-label="Prihvaćeni načini plaćanja i sigurnosni standardi"
    >
      {/* Group A: Acceptance marks */}
      <div className="flex items-center gap-2">
        {ACCEPTANCE.map((logo) => (
          <LogoItem key={logo.alt} logo={logo} height={logoH} />
        ))}
      </div>

      {/* Centre separator: issuer */}
      <LogoItem logo={BANCA_INTESA} height={logoH} />

      {/* Group B: 3D Secure programmes */}
      <div className="flex items-center gap-2">
        {PROGRAMS.map((logo) => (
          <LogoItem key={logo.alt} logo={logo} height={logoH} />
        ))}
      </div>
    </div>
  );
}
