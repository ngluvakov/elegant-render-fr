import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NAV_LEGAL, NAV_MAIN, SITE } from "@/lib/content/site";

const FOOTER_SERVICES = [
  { href: "/usluge/unutrasnji-renderi", label: "Unutrašnji renderi" },
  { href: "/usluge/spoljasnji-renderi", label: "Spoljašnji renderi" },
  { href: "/usluge/virtuelno-opremanje", label: "Virtuelno opremanje" },
  { href: "/usluge/virtuelna-renovacija", label: "Virtuelna renovacija" },
  { href: "/usluge/osnove", label: "2D i 3D osnove prostora" },
  { href: "/usluge/360-ture-i-animacije", label: "360 ture i animacije" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-32 overflow-hidden bg-[#171311] text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,131,99,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(113,143,120,0.12),transparent_28%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]"
      />

      <div className="relative mx-auto w-full max-w-[min(96vw,1720px)] px-6 py-14 md:py-20">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.95fr]">
          <div className="max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-4 transition hover:opacity-90"
            >
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
                <BrandLogo size="md" surface="dark" asChild />
              </div>
              <div>
                <p className="text-[0.94rem] font-semibold uppercase tracking-[0.36em] text-white">
                  Elegant Render
                </p>
                <p className="mt-1 text-[0.7rem] uppercase tracking-[0.24em] text-white/50">
                  Brza kupovina arhitekturne vizuelizacije
                </p>
              </div>
            </Link>

            <p className="mt-6 text-sm leading-7 text-white/70">
              Elegant Render je topao i jasan servis za arhitektonsku
              vizuelizaciju, namenjen privatnim klijentima, agentima,
              arhitektama, dizajnerima i manjim investitorima kojima su važni
              transparentna cena, jednostavan proces i vizuelno poverenje.
            </p>
            <p className="mt-4 text-xs leading-6 text-white/45">
              Diskretno podržano iskustvom kompanije {SITE.parentCompany}.
            </p>
          </div>

          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/45">
              Usluge
            </p>
            <div className="mt-5 grid gap-3 text-sm text-white/75">
              {FOOTER_SERVICES.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[#ddb195]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/45">
              Kompanija
            </p>
            <div className="mt-5 grid gap-3 text-sm text-white/75">
              {NAV_MAIN.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[#ddb195]"
                >
                  {item.label}
                </Link>
              ))}
              {NAV_LEGAL.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[#ddb195]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)] backdrop-blur-sm">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/45">
              Sledeći korak
            </p>
            <h2 className="mt-4 text-2xl leading-tight text-[#f7efe7]">
              Počni od usluge i odmah dobij jasan pravac za cenu i narudžbinu.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Ako želiš da kreneš odmah, vrati se na početnu stranicu i izaberi
              tip vizuelizacije koji ti treba.
            </p>
            <Link
              href="/#naruci"
              className="mt-6 inline-flex items-center rounded-full bg-[#b88363] px-5 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(184,131,99,0.28)] transition hover:bg-[#9f6a4b]"
            >
              Otvori kalkulaciju i narudžbinu
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.parentCompany}. Sva prava
            zadržana. · {SITE.name} je deo {SITE.parentCompany}.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {NAV_LEGAL.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-[#ddb195]"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/kontakt" className="transition hover:text-[#ddb195]">
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
