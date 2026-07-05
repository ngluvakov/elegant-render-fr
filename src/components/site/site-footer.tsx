/**
 * SiteFooter — Dark coal marketing site footer with an editorial
 * library layout: brand band on top, then four columns (Usluge,
 * Kompanija, Pravno, Kontakt), then a certificates strip, the legal
 * imprint snippet, and a minimal bottom bar.
 *
 * Footers are not conversion surfaces — the "next step" CTA lives in a
 * separate <PreFooterCta /> section mounted on secondary marketing
 * pages.
 *
 * Used on: marketing layout (all public pages).
 */
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import { ConsentSettingsLink } from "@/components/site/consent-settings-link";
import { PaymentTrustBadges } from "@/components/marketing/payment-trust-badges";
import { SITE_FEATURES } from "@/lib/site-features";
import {
  CERTIFIER,
  IMPRINT,
  ISO_CERTIFICATIONS,
  type NavItem,
  NAV_LEGAL,
  SITE,
  formatAddress,
} from "@/lib/content/site";

/**
 * Curated anchor services — 5 strategic picks (2 core renders +
 * transformation + premium animation + investor signal) plus a hub
 * link to /services. The hub page lists every service; this footer
 * column signals breadth and primary offerings.
 */
const FOOTER_SERVICES: NavItem[] = [
  { href: "/services/unutrasnji-renderi", label: "Unutrašnji renderi" },
  { href: "/services/spoljasnji-renderi", label: "Spoljašnji renderi" },
  { href: "/services/virtuelno-opremanje", label: "Virtuelno opremanje" },
  { href: "/services/vr-tura", label: "VR tura" },
  { href: "/services/arhitektonska-animacija", label: "Arhitektonska animacija" },
  { href: "/services/situacioni-planovi", label: "3D situacioni planovi" },
];

const KOMPANIJA_LINKS: NavItem[] = [
  { href: "/about", label: "O nama" },
  { href: "/pricing", label: "Cene" },
  { href: "/ai-studio", label: "AI Studio" },
  ...(SITE_FEATURES.portfolio
    ? [{ href: "/portfolio", label: "Portfolio" }]
    : []),
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "Često postavljana pitanja" },
];

const linkBase =
  "text-sm text-white/75 transition hover:text-[var(--color-clay-light)]";

const labelBase =
  "text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/45";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-[var(--color-coal)] text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,131,99,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(113,143,120,0.12),transparent_28%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]"
      />

      <div className="relative mx-auto w-full max-w-[min(96vw,1720px)] px-6 py-14 md:py-20">
        {/* Brand band — logo + name + single-line tagline */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-10 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-4 transition hover:opacity-90"
          >
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
              <BrandLogo size="md" surface="dark" asChild />
            </div>
            <div>
              <p className="text-[0.94rem] font-semibold uppercase tracking-[0.36em] text-white">
                {SITE.name}
              </p>
              <p className="mt-1 text-[0.7rem] uppercase tracking-[0.24em] text-white/55">
                {SITE.tagline}
              </p>
            </div>
          </Link>
          <p className="max-w-xs text-xs leading-6 text-white/45 md:text-right">
            Diskretno podržano iskustvom kompanije {SITE.parentCompany}.
          </p>
        </div>

        {/* Four nav columns */}
        <div className="grid gap-10 border-b border-white/10 py-10 lg:grid-cols-4">
          {/* Usluge */}
          <nav aria-labelledby="footer-usluge">
            <p id="footer-usluge" className={labelBase}>
              Usluge
            </p>
            <ul className="mt-5 grid gap-3">
              {FOOTER_SERVICES.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkBase}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-clay-light)] transition hover:text-white"
                >
                  Sve usluge <span aria-hidden>→</span>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Kompanija */}
          <nav aria-labelledby="footer-kompanija">
            <p id="footer-kompanija" className={labelBase}>
              Kompanija
            </p>
            <ul className="mt-5 grid gap-3">
              {KOMPANIJA_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkBase}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Pravno */}
          <nav aria-labelledby="footer-pravno">
            <p id="footer-pravno" className={labelBase}>
              Pravno
            </p>
            <ul className="mt-5 grid gap-3">
              {NAV_LEGAL.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkBase}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Kontakt */}
          <div>
            <p className={labelBase}>Kontakt</p>
            <ul className="mt-5 grid gap-4 text-sm text-white/75">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="group inline-flex items-start gap-2.5 transition hover:text-[var(--color-clay-light)]"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-white/45 transition group-hover:text-[var(--color-clay-light)]" />
                  <span className="break-all">{SITE.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={SITE.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-start gap-2.5 transition hover:text-[var(--color-clay-light)]"
                >
                  <ExternalLink className="mt-0.5 size-4 shrink-0 text-white/45 transition group-hover:text-[var(--color-clay-light)]" />
                  <span>Instagram @elegantrender</span>
                </a>
              </li>
              <li>
                <div className="inline-flex items-start gap-2.5 text-white/65">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-white/45" />
                  <span className="leading-6">
                    {IMPRINT.street}, {IMPRINT.postalCode} {IMPRINT.city}
                    <br />
                    {IMPRINT.country}
                  </span>
                </div>
              </li>
              <li className="pt-1">
                <QuickInquiryLink
                  inquiry={{
                    source: "site-footer",
                    sourceLabel: "Footer brzi upit",
                  }}
                  className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white/85 transition hover:border-[var(--color-clay-light)] hover:text-[var(--color-clay-light)]"
                >
                  Brzi upit
                </QuickInquiryLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Certificates strip */}
        <div className="border-b border-white/10 py-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/45">
            Sertifikati i standardi
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/55">
            {/* Badge has silver bevel + TÜV blue — wrap in a tight white
                card so it reads cleanly on the dark coal surface. */}
            <Link
              href="/legal/certificates"
              aria-label={`${CERTIFIER.name} sertifikat — sertifikati i standardi`}
              className="inline-flex shrink-0 rounded-md bg-white p-1.5 transition hover:opacity-90"
            >
              <Image
                src={CERTIFIER.badgeAsset.src}
                alt={CERTIFIER.badgeAsset.alt}
                width={CERTIFIER.badgeAsset.width}
                height={CERTIFIER.badgeAsset.height}
                className="h-9 w-auto"
              />
            </Link>
            {ISO_CERTIFICATIONS.map((cert) => (
              <span key={cert.id}>
                {cert.code}{" "}
                <span className="text-white/35">· {CERTIFIER.name}</span>
              </span>
            ))}
            <Link
              href="/legal/certificates"
              className="ml-auto text-white/65 transition hover:text-[var(--color-clay-light)]"
            >
              O sertifikatima →
            </Link>
          </div>
        </div>

        {/* Payment trust strip — Banca Intesa EPM standards (poglavlje 2.2)
            require these brand badges on the checkout footer with links
            to the official Visa Secure / Mastercard ID Check / issuing
            bank pages. Surfaced site-wide so the inspector sees them
            on every public page. */}
        <div className="border-b border-white/10 py-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/45">
            Sigurno plaćanje
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/55">
            <PaymentTrustBadges className="text-white/75" />
          </div>
        </div>

        {/* Imprint — Zakon o elektronskoj trgovini čl. 7 requires the
            registered name, registry numbers and address on every page;
            /legal/imprint surfaces the full legal identity. */}
        <div className="border-b border-white/10 py-5 text-xs leading-relaxed text-white/55">
          <p>
            <strong className="text-white/75">{IMPRINT.shortName}</strong>
            {" · "}
            {formatAddress()}
            {" · "}MB {IMPRINT.registryNumber}
            {" · "}PIB {IMPRINT.taxId}
          </p>
        </div>

        {/* Bottom bar — copyright + consent settings only. Nav and legal
            links are already covered by the columns above. */}
        <div className="flex flex-col gap-3 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.parentCompany}. Sva prava
            zadržana. · {SITE.name} je deo {SITE.parentCompany}.
          </p>
          <ConsentSettingsLink className="self-start transition hover:text-[var(--color-clay-light)] md:self-auto" />
        </div>
      </div>
    </footer>
  );
}
