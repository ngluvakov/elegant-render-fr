import type { Metadata } from "next";
import { MessageSquareWarning } from "lucide-react";
import { prisma } from "@/lib/db";
import { chatFeedbackCategoryLabel } from "@/lib/chat/feedback";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "AI asistent — zahtevi klijenata",
  robots: { index: false, follow: false },
};

const CATEGORY_STYLES: Record<string, string> = {
  complaint: "bg-destructive/10 text-destructive",
  missing_feature: "bg-accent/10 text-accent",
  request: "bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]",
  confusion: "bg-secondary text-muted-foreground",
};

export default async function AdminChatFeedbackPage() {
  await requirePermission("ANALYTICS_VIEW");
  const feedback = await prisma.chatFeedback.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = feedback.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-foreground md:text-4xl">
          AI asistent — zahtevi klijenata
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mesto za kritike, nedostajuće opcije, nejasnoće i korisničke predloge
          uhvaćene kroz chat.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["complaint", "missing_feature", "request", "confusion"].map(
          (category) => (
            <div
              key={category}
              className="rounded-2xl border border-border/40 bg-card/80 p-4"
            >
              <p className="text-2xl font-bold text-foreground">
                {counts[category] ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {chatFeedbackCategoryLabel(category)}
              </p>
            </div>
          ),
        )}
      </div>

      <div className="space-y-3">
        {feedback.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-border/40 bg-card/80 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <MessageSquareWarning className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${
                        CATEGORY_STYLES[item.category] ??
                        "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {chatFeedbackCategoryLabel(item.category)}
                    </span>
                    {item.pagePath && (
                      <span className="text-xs text-muted-foreground">
                        {item.pagePath}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {item.body}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>
                  {item.createdAt.toLocaleDateString("sr-Latn-RS", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p>
                  {item.createdAt.toLocaleTimeString("sr-Latn-RS", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="mt-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {item.user?.name ?? "Anonimni posetilac"}
              </span>
              {item.user?.email && <span> · {item.user.email}</span>}
              {item.sessionId && <span> · sesija {item.sessionId.slice(0, 8)}</span>}
            </div>
          </article>
        ))}

        {feedback.length === 0 && (
          <div className="rounded-2xl border border-border/40 bg-card/80 px-6 py-10 text-center text-sm text-muted-foreground">
            Još nema zabeleženih kritika ili zahteva iz AI chata.
          </div>
        )}
      </div>
    </div>
  );
}
