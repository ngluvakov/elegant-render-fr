"use client";

import { ArrowRight, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { stashCreditQuote } from "@/components/marketing/ai-studio/credit-buy-dock";

type CreditCheckoutButtonProps = {
  credits?: number;
  label?: string;
  variant?: "accent" | "outline";
  size?: "lg" | "xl";
  className?: string;
};

export function CreditCheckoutButton({
  credits = 10,
  label = "Kupi kredite",
  variant = "accent",
  size = "lg",
  className,
}: CreditCheckoutButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        stashCreditQuote(credits);
        router.push("/poruci");
      }}
    >
      <Coins className="h-4 w-4" />
      {label}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
