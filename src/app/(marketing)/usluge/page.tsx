import type { Metadata } from "next";
import { ServicesShowcase } from "@/components/marketing/services-showcase";

export const metadata: Metadata = {
  title: "Usluge",
  description:
    "Kompletna ponuda arhitektonske vizuelizacije — renderi, animacije, 360 ture, virtuelno opremanje i adaptacije prostora.",
  openGraph: {
    title: "Usluge — Elegant Render",
    description:
      "Kompletna ponuda arhitektonske vizuelizacije — renderi, animacije, 360 ture, virtuelno opremanje i adaptacije prostora.",
    url: "/usluge",
  },
};

export default function UslugePage() {
  return (
    <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-12 md:pt-20">
      <ServicesShowcase />
    </div>
  );
}
