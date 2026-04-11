import { QuickOrderHero } from "@/components/marketing/quick-order-hero";
import { PlatformPrinciples } from "@/components/marketing/platform-principles";
import { ModelFirst } from "@/components/marketing/model-first";
import { NextIteration } from "@/components/marketing/next-iteration";
import { FaqCards } from "@/components/marketing/faq-cards";

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
