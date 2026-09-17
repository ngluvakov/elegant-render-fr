import Link from "next/link";

/**
 * IsoStrip — slim TÜV Rheinland / ISO trust strip (White Rook design).
 * Kept from the international redesign by owner decision even though the
 * .rs homepage has no equivalent section.
 *
 * Used on: homepage (between ModelFirst and NextIteration).
 */
export function IsoStrip() {
  const badges = ["ISO 9001:2015", "ISO/IEC 27001:2022", "ISO 50001:2018"];
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-6 px-6 py-10 sm:px-12 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Certifié par TÜV Rheinland — audité chaque année, non auto-déclaré.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {badges.map((badge) => (
            <Link
              key={badge}
              href="/informations-legales/certificats"
              className="rounded-full border border-[#d4d4d4] px-3.5 py-1.5 font-mono text-xs tracking-[0.04em] text-foreground transition-colors duration-200 hover:border-[#111111]"
            >
              {badge}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
