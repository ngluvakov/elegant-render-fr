import type { Metadata } from "next";
import { QuickOrderHero } from "@/components/marketing/quick-order-hero";
import { PlatformPrinciples } from "@/components/marketing/platform-principles";
import { ModelFirst } from "@/components/marketing/model-first";
import { NextIteration } from "@/components/marketing/next-iteration";
import { FaqCards } from "@/components/marketing/faq-cards";
import { SITE } from "@/lib/content/site";

export const metadata: Metadata = {
  title: `${SITE.name} — Arhitektonska vizuelizacija`,
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: "/",
  },
};

export default function Home() {
  return (
    <>
      <QuickOrderHero />
      <PlatformPrinciples />
      <ModelFirst />
      <NextIteration />
      <FaqCards />
    </>
  );
}
