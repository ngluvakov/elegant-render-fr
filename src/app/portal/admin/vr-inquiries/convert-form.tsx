"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertVrInquiryToOrder } from "@/server/actions/vr-inquiry";
import { track } from "@/lib/posthog-events";

type Props = {
  inquiryId: string;
  defaultProjectName: string;
  defaultPriceEur: number;
  convertedOrderId: string | null;
  convertedOrderNumber?: string;
};

export function VrInquiryConvertForm({
  inquiryId,
  defaultProjectName,
  defaultPriceEur,
  convertedOrderId,
  convertedOrderNumber,
}: Props) {
  const [open, setOpen] = useState(false);
  const [priceEur, setPriceEur] = useState(String(defaultPriceEur));
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (convertedOrderId) {
    return (
      <Link
        href={`/portal/admin/orders/${convertedOrderId}`}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent/15 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent/25"
      >
        <Check className="h-3 w-3" />
        Open order {convertedOrderNumber ?? ""}
        <ArrowRight className="h-3 w-3" />
      </Link>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-[var(--color-green-hover)]"
      >
        Convert to order →
      </button>
    );
  }

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await convertVrInquiryToOrder({
        inquiryId,
        priceEur: Number(priceEur),
        projectName: projectName.trim() || undefined,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      track("vr_inquiry_converted", {
        inquiry_id: inquiryId,
        order_number: res.orderNumber,
        price_eur: Number(priceEur),
      });
      router.refresh();
    });
  };

  return (
    <div className="w-full space-y-3 rounded-lg border border-accent/30 bg-accent/[0.05] p-3">
      <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-accent">
        Convert to order
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor={`pname-${inquiryId}`} className="text-[0.72rem]">
            Project name
          </Label>
          <Input
            id={`pname-${inquiryId}`}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={pending}
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`price-${inquiryId}`} className="text-[0.72rem]">
            Price (EUR)
          </Label>
          <Input
            id={`price-${inquiryId}`}
            type="number"
            min={1}
            step={1}
            value={priceEur}
            onChange={(e) => setPriceEur(e.target.value)}
            disabled={pending}
            className="w-32"
          />
        </div>
      </div>
      <p className="text-[0.7rem] text-muted-foreground">
        The order moves to <strong>awaiting_payment</strong> with this price. The client
        receives an email with a magic link and can pay.
      </p>
      {error && (
        <p className="text-[0.72rem] text-destructive">{error}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="accent"
          onClick={submit}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Converting…
            </>
          ) : (
            "Confirm and send email"
          )}
        </Button>
      </div>
    </div>
  );
}
