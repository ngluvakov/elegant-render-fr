/**
 * OrderDetailHero — Header block for a single order showing order number,
 * inline project-name editor (for drafts), status badge, total amount, and
 * creation/update dates.
 *
 * Used on: /portal/porudzbine/[orderId] (order detail page).
 */
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";
import { statusLabel, statusAccent } from "./status-utils";
import { ProjectNameEditor } from "./project-name-editor";

type OrderDetailHeroProps = {
  orderId: string;
  orderNumber: string;
  status: string;
  totalEur: number;
  createdAt: Date;
  updatedAt: Date;
  projectName: string | null;
  firstItemLabel?: string;
  firstItemCategory?: string;
};

export function OrderDetailHero({
  orderId,
  orderNumber,
  status,
  totalEur,
  createdAt,
  updatedAt,
  projectName,
  firstItemLabel,
  firstItemCategory,
}: OrderDetailHeroProps) {
  const editable = status === "draft";
  const fallback = firstItemLabel ?? orderNumber;

  return (
    <div>
      <Link
        href="/portal/porudzbine"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Porudžbine
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {orderNumber}
          </p>
          <ProjectNameEditor
            orderId={orderId}
            initialName={projectName}
            fallbackLabel={fallback}
            editable={editable}
          />
          {firstItemCategory && (
            <p className="mt-1 text-sm text-muted-foreground">
              {firstItemCategory}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Kreirana{" "}
            {createdAt.toLocaleDateString("sr-Latn-RS", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" · "}
            Ažurirano{" "}
            {updatedAt.toLocaleDateString("sr-Latn-RS", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusAccent(status)}>{statusLabel(status)}</Badge>
          <p className="text-2xl font-bold text-foreground">
            {formatEur(totalEur)}
          </p>
        </div>
      </div>
    </div>
  );
}
