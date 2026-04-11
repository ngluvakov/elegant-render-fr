import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ServicesGrid } from "@/components/marketing/services-grid";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { WhyUs } from "@/components/marketing/why-us";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <PricingPreview />
      <HowItWorks />
      <ServicesGrid preview />
      <WhyUs />
      <Faq />
      <FinalCta />
    </>
  );
}
