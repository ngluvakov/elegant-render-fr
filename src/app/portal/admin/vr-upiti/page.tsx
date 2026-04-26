import type { Metadata } from "next";
import { Headphones, Mail, Phone, User } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  defaultVrConfig,
  sanitizeVrConfig,
  vrProductLabel,
  type VrConfig,
  type VrProductId,
} from "@/lib/catalog/vr-config";
import { VrInquiryStatusActions } from "./status-actions";

export const metadata: Metadata = {
  title: "VR upiti — Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string }>;

const STATUS_LABELS: Record<string, string> = {
  pending: "Čeka pregled",
  in_progress: "U razgovoru",
  converted: "Konvertovano",
  closed: "Zatvoreno",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  in_progress: "outline",
  converted: "secondary",
  closed: "outline",
};

function readConfig(raw: unknown): VrConfig {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return sanitizeVrConfig(raw as VrConfig);
  }
  return defaultVrConfig();
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default async function VrInquiriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status } = await searchParams;
  const where = status ? { status: status as "pending" | "in_progress" | "converted" | "closed" } : {};

  const [inquiries, counts] = await Promise.all([
    prisma.vrInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.vrInquiry.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all]),
  ) as Record<string, number>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-3xl text-foreground">VR upiti</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Konsultacioni intake za VR projekte. Klijent popuni formu na
          /usluge/vr/konsultacija; tim pregleda i kreira ručno order po
          dogovoru.
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["", "pending", "in_progress", "converted", "closed"] as const).map(
          (s) => {
            const isActive = (status ?? "") === s;
            const count = s ? countByStatus[s] ?? 0 : counts.reduce((sum, c) => sum + c._count._all, 0);
            return (
              <a
                key={s || "all"}
                href={s ? `?status=${s}` : "?"}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-background/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                }`}
              >
                {s ? STATUS_LABELS[s] : "Sve"}
                <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[0.62rem] tabular-nums">
                  {count}
                </span>
              </a>
            );
          },
        )}
      </div>

      {/* List */}
      {inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-card/40 px-6 py-16 text-center">
          <Headphones className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            {status
              ? `Nema upita sa statusom "${STATUS_LABELS[status] ?? status}".`
              : "Još nema VR upita."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => {
            const cfg = readConfig(inq.configJson);
            return (
              <div
                key={inq.id}
                className="rounded-xl border border-border/40 bg-card/80 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {inq.contactName}
                      </h3>
                      <Badge variant={STATUS_VARIANTS[inq.status] ?? "default"}>
                        {STATUS_LABELS[inq.status] ?? inq.status}
                      </Badge>
                      <span className="text-[0.72rem] text-muted-foreground">
                        pre {formatRelative(inq.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {vrProductLabel(inq.productId as VrProductId)} ·{" "}
                      {cfg.experienceType} · {cfg.targetDevice}
                    </p>
                  </div>
                  <VrInquiryStatusActions
                    inquiryId={inq.id}
                    status={inq.status}
                  />
                </div>

                <div className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                      Kontakt
                    </p>
                    <p className="flex items-center gap-1.5 text-foreground">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {inq.contactName}
                    </p>
                    <p className="flex items-center gap-1.5 text-foreground">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <a href={`mailto:${inq.email}`} className="hover:underline">
                        {inq.email}
                      </a>
                    </p>
                    {inq.phone && (
                      <p className="flex items-center gap-1.5 text-foreground">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <a href={`tel:${inq.phone}`} className="hover:underline">
                          {inq.phone}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                      Konfiguracija
                    </p>
                    <p className="text-foreground">
                      <strong>Naziv:</strong> {cfg.projectName}
                    </p>
                    {cfg.locomotion && (
                      <p className="text-foreground">
                        <strong>Locomotion:</strong> {cfg.locomotion}
                      </p>
                    )}
                    {cfg.dayNightMode && (
                      <p className="text-foreground">
                        <strong>Day/Night:</strong> {cfg.dayNightMode}
                      </p>
                    )}
                    {(cfg.doorInteraction ||
                      cfg.lightsInteraction ||
                      cfg.materialsInteraction) && (
                      <p className="text-foreground">
                        <strong>Interakcije:</strong>{" "}
                        {[
                          cfg.doorInteraction && "vrata",
                          cfg.lightsInteraction && "svetla",
                          cfg.materialsInteraction && "materijali",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {(cfg.description || inq.message) && (
                  <div className="mt-4 space-y-3">
                    {cfg.description && (
                      <div className="rounded-md bg-secondary/40 px-3 py-2">
                        <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                          Opis projekta
                        </p>
                        <p className="whitespace-pre-wrap text-xs text-foreground">
                          {cfg.description}
                        </p>
                      </div>
                    )}
                    {inq.message && (
                      <div className="rounded-md bg-secondary/40 px-3 py-2">
                        <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                          Dodatna poruka
                        </p>
                        <p className="whitespace-pre-wrap text-xs text-foreground">
                          {inq.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
