/**
 * PaymentTrustBadges — Bank-mandated brand badges for the checkout
 * footer. EPM standard 2.2 requires linking the official Visa Secure
 * and Mastercard ID Check pages alongside the issuing bank (Banca
 * Intesa). Mastercard and Visa card-scheme logos are shown to indicate
 * accepted networks.
 *
 * Brand assets live in /public/branding/payments/. If a file is
 * missing the badge falls back to its alt text inside a brand-tone
 * box so the inspection page never renders empty.
 *
 * Used by: footer (site-wide) and the checkout payment step.
 */

const BADGES: Array<{
  label: string;
  src: string;
  href: string;
  ariaLabel: string;
  width: number;
  height: number;
}> = [
  {
    label: "Visa",
    src: "/branding/payments/visa.svg",
    href: "https://rs.visa.com/pay-with-visa/security-and-assistance/protected-everywhere.html",
    ariaLabel: "Visa kartice",
    width: 56,
    height: 18,
  },
  {
    label: "Visa Secure",
    src: "/branding/payments/visa-secure.svg",
    href: "https://rs.visa.com/pay-with-visa/security-and-assistance/protected-everywhere.html",
    ariaLabel: "Visa Secure — 3D Secure autentifikacija",
    width: 56,
    height: 22,
  },
  {
    label: "Mastercard",
    src: "/branding/payments/mastercard.svg",
    href: "https://www.mastercard.rs/sr-rs/korisnici/pronadite-karticu.html",
    ariaLabel: "Mastercard kartice",
    width: 56,
    height: 22,
  },
  {
    label: "Mastercard ID Check",
    src: "/branding/payments/mastercard-id-check.svg",
    href: "https://www.mastercard.rs/sr-rs/korisnici/pronadite-karticu.html",
    ariaLabel: "Mastercard ID Check — 3D Secure autentifikacija",
    width: 56,
    height: 22,
  },
  {
    label: "Banca Intesa",
    src: "/branding/payments/banca-intesa.svg",
    href: "https://www.bancaintesa.rs",
    ariaLabel: "Banca Intesa AD Beograd — payment gateway",
    width: 80,
    height: 22,
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
      className={`flex flex-wrap items-center gap-3 ${className}`}
      aria-label="Prihvaćeni načini plaćanja i sigurnosni standardi"
    >
      {BADGES.map((badge) => (
        <li key={badge.label}>
          <a
            href={badge.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center rounded-md border border-border/40 bg-card/80 px-2 py-1 text-[0.62rem] font-semibold text-foreground/70 transition hover:border-accent/40 hover:text-foreground"
            aria-label={badge.ariaLabel}
            title={badge.ariaLabel}
            style={{ minHeight: itemHeight + 8 }}
          >
            {/* When /branding/payments/<file>.svg is deployed the
                browser shows the image; otherwise the alt text is
                shown automatically, which is what an inspector needs
                to see in a broken-asset state. */}
            <img
              src={badge.src}
              alt={badge.label}
              width={badge.width}
              height={itemHeight}
              loading="lazy"
              className="w-auto object-contain"
              style={{ height: itemHeight }}
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
