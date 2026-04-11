import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NAV_LEGAL, NAV_MAIN, SITE } from "@/lib/content/site";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/70">
              {SITE.description}
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-foreground/50">
              {SITE.name} je deo {SITE.parentCompany}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Navigacija
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {NAV_MAIN.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Pravno
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {NAV_LEGAL.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Kontakt
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-foreground/80 transition-colors hover:text-foreground"
                >
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-border/40 pt-6 text-xs text-foreground/50">
          © {new Date().getFullYear()} {SITE.parentCompany}. Sva prava zadržana.
        </div>
      </div>
    </footer>
  );
}
