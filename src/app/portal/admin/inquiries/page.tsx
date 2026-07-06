import type { Metadata } from "next";
import type { Prisma, ProjectInquiryStatus } from "@/generated/prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Inbox,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatInquiryFileSize } from "@/lib/project-inquiry";
import { ProjectInquiryActions } from "./inquiry-actions";
import { adminHas, requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Inquiries — Admin",
  description:
    "Admin overview of project inquiries, processing status, and follow-up priorities.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string; highlight?: string }>;

const STATUS_LABELS: Record<ProjectInquiryStatus, string> = {
  pending: "Pending review",
  in_progress: "In conversation",
  proposal_sent: "Estimate sent",
  converted: "Converted",
  closed: "Closed",
};

const STATUS_VARIANTS: Record<
  ProjectInquiryStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "default",
  in_progress: "outline",
  proposal_sent: "secondary",
  converted: "secondary",
  closed: "outline",
};

const VALID_STATUSES = new Set<ProjectInquiryStatus>([
  "pending",
  "in_progress",
  "proposal_sent",
  "converted",
  "closed",
]);

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${Math.max(0, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function stringifySnapshot(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  try {
    return JSON.stringify(snapshot, null, 2);
  } catch {
    return null;
  }
}

export default async function ProjectInquiriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status, highlight } = await searchParams;
  const admin = await requirePermission("INQUIRIES_MANAGE");
  const canConvertToOrder = adminHas(admin, "FINANCE_MANAGE");
  const statusFilter =
    status && VALID_STATUSES.has(status as ProjectInquiryStatus)
      ? (status as ProjectInquiryStatus)
      : undefined;

  const where: Prisma.ProjectInquiryWhereInput = statusFilter
    ? { status: statusFilter }
    : {};

  const [inquiries, counts] = await Promise.all([
    prisma.projectInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        files: true,
        convertedOrders: {
          orderBy: { createdAt: "asc" },
          select: { id: true, orderNumber: true, status: true },
          take: 1,
        },
      },
    }),
    prisma.projectInquiry.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((count) => [count.status, count._count._all]),
  ) as Record<ProjectInquiryStatus, number>;
  const totalCount = counts.reduce((sum, count) => sum + count._count._all, 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-3xl text-foreground">Inquiries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick and contact inquiries from the marketing site. These are pre-sales leads;
          the estimate is sent manually from email or Bitrix.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["", ...Array.from(VALID_STATUSES)] as const).map((item) => {
          const isActive = (statusFilter ?? "") === item;
          const count = item ? countByStatus[item] ?? 0 : totalCount;
          return (
            <a
              key={item || "all"}
              href={item ? `?status=${item}` : "?"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-background/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
              }`}
            >
              {item ? STATUS_LABELS[item] : "All"}
              <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[0.62rem] tabular-nums">
                {count}
              </span>
            </a>
          );
        })}
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-card/40 px-6 py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            There are no inquiries for the selected filter yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => {
            const snapshot = stringifySnapshot(inquiry.quoteSnapshotJson);
            const isHighlighted = highlight === inquiry.id;
            return (
              <article
                key={inquiry.id}
                className={`rounded-xl border bg-card/80 p-5 ${
                  isHighlighted
                    ? "border-accent shadow-[0_16px_45px_rgba(184,131,99,0.12)]"
                    : "border-border/40"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">
                        {inquiry.contactName}
                      </h2>
                      <Badge variant={STATUS_VARIANTS[inquiry.status]}>
                        {STATUS_LABELS[inquiry.status]}
                      </Badge>
                      <span className="text-[0.72rem] text-muted-foreground">
                        {formatRelative(inquiry.createdAt)} ago
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inquiry.serviceType ?? "Service type not provided"}
                      {inquiry.sourceLabel ? ` · ${inquiry.sourceLabel}` : ""}
                    </p>
                  </div>
                  <ProjectInquiryActions
                    inquiryId={inquiry.id}
                    status={inquiry.status}
                    canRetryBitrix={!inquiry.bitrixLeadId}
                    canConvertToOrder={canConvertToOrder}
                  />
                </div>

                <div className="mt-4 grid gap-4 text-xs lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-1.5">
                    <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                      Contact
                    </p>
                    <p className="flex items-center gap-1.5 text-foreground">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {inquiry.contactName}
                      {inquiry.company ? ` · ${inquiry.company}` : ""}
                    </p>
                    <p className="flex items-center gap-1.5 text-foreground">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <a href={`mailto:${inquiry.email}`} className="hover:underline">
                        {inquiry.email}
                      </a>
                    </p>
                    {inquiry.phone && (
                      <p className="flex items-center gap-1.5 text-foreground">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <a href={`tel:${inquiry.phone}`} className="hover:underline">
                          {inquiry.phone}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                      Estimate
                    </p>
                    {inquiry.budget && (
                      <p className="text-foreground">
                        <strong>Budget:</strong> {inquiry.budget}
                      </p>
                    )}
                    {inquiry.deadline && (
                      <p className="text-foreground">
                        <strong>Deadline:</strong> {inquiry.deadline}
                      </p>
                    )}
                    <p className="text-foreground">
                      <strong>Source:</strong>{" "}
                      {inquiry.sourceLabel ?? inquiry.source ?? "Not provided"}
                      {inquiry.sourcePath ? ` (${inquiry.sourcePath})` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-md bg-secondary/40 px-3 py-2">
                  <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Project description
                  </p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                    {inquiry.message}
                  </p>
                </div>

                {inquiry.files.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      Files ({inquiry.files.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {inquiry.files.map((file) => {
                        const unscanned = file.scanStatus !== "clean";
                        return (
                          <a
                            key={file.id}
                            href={`/api/admin/inquiries/download?fileId=${file.id}`}
                            title={
                              unscanned
                                ? "This file was NOT antivirus-scanned (the scanner was unavailable when it was sent). Download it carefully."
                                : undefined
                            }
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                              unscanned
                                ? "border-destructive/40 bg-destructive/5 text-destructive hover:border-destructive/60"
                                : "border-border/40 bg-background/70 text-foreground hover:border-accent/40 hover:text-accent"
                            }`}
                          >
                            {unscanned ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : (
                              <FileText className="h-3.5 w-3.5" />
                            )}
                            <span className="max-w-[14rem] truncate">
                              {file.fileName}
                            </span>
                            <span
                              className={
                                unscanned ? "text-destructive/80" : "text-muted-foreground"
                              }
                            >
                              {unscanned
                                ? "nije skeniran"
                                : formatInquiryFileSize(file.fileSize)}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {snapshot && (
                  <details className="mt-4 rounded-md border border-border/40 bg-background/50 px-3 py-2">
                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                      Snapshot iz konfiguratora
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[0.7rem] leading-relaxed text-foreground/80">
                      {snapshot}
                    </pre>
                  </details>
                )}

                {inquiry.convertedOrders.length > 0 && (
                  <div className="mt-4 rounded-md border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/8 px-3 py-2">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-[color:var(--color-sage-deep)]">
                      Converted to order
                    </p>
                    <a
                      href={`/portal/admin/orders/${inquiry.convertedOrders[0].id}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline"
                    >
                      {inquiry.convertedOrders[0].orderNumber}
                      <span className="text-muted-foreground">
                        · {inquiry.convertedOrders[0].status}
                      </span>
                    </a>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/30 pt-3 text-xs">
                  {inquiry.bitrixLeadId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-sage)]/10 px-2.5 py-1 text-[color:var(--color-sage-deep)]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Bitrix Lead #{inquiry.bitrixLeadId}
                    </span>
                  ) : inquiry.bitrixSyncError ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1 text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Bitrix error: {inquiry.bitrixSyncError}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-muted-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Bitrix sync pokrenut
                    </span>
                  )}
                  <span className="text-muted-foreground">ID: {inquiry.id}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
