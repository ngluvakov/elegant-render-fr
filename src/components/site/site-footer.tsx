/**
 * SiteFooter — dark (#0a0a0a) marketing footer per the White Rook design
 * handoff: grid 1.4fr/1fr/1fr/1fr — ER white logo + description, then
 * Services / Company / Legal link columns (mono uppercase labels), the
 * certificates strip, the legal imprint line, and a bottom row with the
 * White Rook attribution ("part of White Rook DOO") + copyright.
 *
 * Footers are not conversion surfaces — the "next step" CTA lives in a
 * separate <PreFooterCta /> section mounted on secondary marketing pages.
 *
 * Used on: marketing layout (all public pages).
 */
import Image from "next/image";
import Link from "next/link";
import { ConsentSettingsLink } from "@/components/site/consent-settings-link";
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
 * Curated anchor services — strategic picks (2 core renders +
 * transformation + premium tour + investor signal) plus a hub link to
 * /services. The hub page lists every service; this footer column
 * signals breadth and primary offerings.
 */
const FOOTER_SERVICES: NavItem[] = [
  { href: "/services/interior-renders", label: "Rendus d’intérieur" },
  { href: "/services/exterior-renders", label: "Rendus d’extérieur" },
  { href: "/services/virtual-staging", label: "Home staging virtuel" },
  { href: "/services/vr-tour", label: "Visites 360° & VR" },
  { href: "/services/architectural-animation", label: "Animation architecturale" },
  { href: "/services/site-plans", label: "Plans de masse 3D" },
];

const COMPANY_LINKS: NavItem[] = [
  { href: "/about", label: "À propos" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/ai-studio", label: "AI Studio" },
  ...(SITE_FEATURES.portfolio
    ? [{ href: "/portfolio", label: "Portfolio" }]
    : []),
  { href: "/blog", label: "Blog" },
  { href: "/career", label: "Carrières" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const linkBase =
  "text-sm text-white/75 transition-colors duration-200 hover:text-white hover:underline";

const labelBase =
  "font-mono text-xs uppercase tracking-[0.08em] text-white/40";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-[#0a0a0a] text-white">
      <div className="mx-auto w-full max-w-[1280px] px-6 pt-16 sm:px-12 md:pt-20">
        {/* Main grid — brand block + three link columns */}
        <div className="grid gap-12 pb-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-block" aria-label="Elegant Render — accueil">
              <Image
                src="/branding/er-logo-white.png"
                alt="Elegant Render"
                width={2011}
                height={3186}
                className="mb-5 h-24 w-auto"
              />
            </Link>
            <p className="max-w-[300px] text-sm leading-relaxed text-white/55">
              Visualisation architecturale réalisée à la main, aux tarifs
              transparents, pour des logements et des biens partout en France.
            </p>
          </div>

          <nav aria-labelledby="footer-services">
            <p id="footer-services" className={labelBase}>
              Services
            </p>
            <ul className="mt-4 grid gap-2.5">
              {FOOTER_SERVICES.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkBase}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link href="/services" className={linkBase}>
                  Tous les services →
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-company">
            <p id="footer-company" className={labelBase}>
              Entreprise
            </p>
            <ul className="mt-4 grid gap-2.5">
              {COMPANY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkBase}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <p id="footer-legal" className={labelBase}>
              Informations légales
            </p>
            <ul className="mt-4 grid gap-2.5">
              {NAV_LEGAL.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkBase}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Certificates strip */}
        <div className="border-t border-white/12 py-6">
          <p className={labelBase}>Certificats et normes</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/55">
            {/* Badge has silver bevel + TÜV blue — wrap in a tight white
                card so it reads cleanly on the dark surface. */}
            <Link
              href="/legal/certificates"
              aria-label={`Certificat ${CERTIFIER.name} — certificats et normes`}
              className="inline-flex shrink-0 rounded-[4px] bg-white p-1.5 transition-opacity duration-200 hover:opacity-90"
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
              <span key={cert.id} className="font-mono tracking-[0.04em]">
                {cert.code}{" "}
                <span className="text-white/35">· {CERTIFIER.name}</span>
              </span>
            ))}
            <Link
              href="/legal/certificates"
              className="ml-auto text-white/65 transition-colors duration-200 hover:text-white hover:underline"
            >
              À propos des certificats →
            </Link>
          </div>
        </div>

        {/* Imprint — e-commerce disclosure rules require the registered
            name, registry numbers and address on every page;
            /legal/imprint surfaces the full legal identity. */}
        <div className="border-t border-white/12 py-5 text-xs leading-relaxed text-white/55">
          <p>
            <strong className="text-white/75">{IMPRINT.shortName}</strong>
            {" · "}
            {formatAddress()}
            {" · "}MB {IMPRINT.registryNumber}
            {" · "}PIB {IMPRINT.taxId}
          </p>
        </div>

        {/* Bottom row — White Rook attribution (once per page) + copyright */}
        <div className="flex flex-col gap-4 border-t border-white/12 py-7 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <Image
              src="/branding/wr-logo-horizontal-white.png"
              alt="White Rook"
              width={7598}
              height={1826}
              className="h-[26px] w-auto opacity-90"
            />
            <span className="text-[13px] text-white/50">
              Elegant Render fait partie de White Rook DOO — visualisation 3D
              &amp; actifs numériques.
            </span>
          </div>
          <div className="flex items-center gap-5">
            <ConsentSettingsLink className="text-xs text-white/45 transition-colors duration-200 hover:text-white" />
            <span className="font-mono text-xs text-white/35 tabular-nums">
              © {new Date().getFullYear()} {SITE.parentCompany}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
