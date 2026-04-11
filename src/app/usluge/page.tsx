import type { Metadata } from "next";
import { ServicesGrid } from "@/components/marketing/services-grid";
import { FinalCta } from "@/components/marketing/final-cta";
import { SectionKicker } from "@/components/brand/section-kicker";

export const metadata: Metadata = {
  title: "Usluge",
  description:
    "Kompletna ponuda arhitektonske vizuelizacije — renderi, animacije, 360 ture, virtuelno opremanje i adaptacije prostora.",
};

export default function UslugePage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] px-6 pt-20 md:pt-28">
        <SectionKicker>Usluge</SectionKicker>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Sve što vam treba za jasan prikaz prostora
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          Od pojedinačnih kadrova do kompletnih virtuelnih tura. Svaka usluga je
          jasno definisana — unapred znate šta dobijate i koliko to košta.
        </p>
      </div>
      <ServicesGrid />
      <FinalCta />
    </>
  );
}
