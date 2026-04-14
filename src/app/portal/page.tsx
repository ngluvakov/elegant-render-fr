import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { formatEur } from "@/lib/catalog/calculate";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Nacrt",
  awaiting_payment: "Čeka plaćanje",
  paid: "Plaćeno",
  in_progress: "U izradi",
  in_review: "Na pregledu",
  revision_requested: "Revizija",
  delivered: "Isporučeno",
  closed: "Zatvoreno",
  cancelled: "Otkazano",
  refunded: "Refundirano",
};

export default async function PortalPage() {
  const session = await auth();
  const user = session?.user;

  const recentOrders = user?.id
    ? await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  return (
    <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 py-20 md:py-28">
      <SectionKicker>Portal</SectionKicker>
      <h1 className="mt-4 text-4xl text-foreground md:text-5xl">
        Dobrodošli, {user?.name?.split(" ")[0] || "korisniče"}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Pratite porudžbine, komunicirajte sa timom i preuzmite gotove fajlove.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Orders card */}
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Porudžbine
            </h2>
            {recentOrders.length > 0 && (
              <Link
                href="/portal/porudzbine"
                className="text-xs font-medium text-accent hover:underline"
              >
                Sve porudžbine
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Nemate porudžbina. Posetite cenovnik da napravite prvu.
              </p>
              <div className="mt-4">
                <ButtonLink href="/cene" size="sm" variant="accent">
                  Pogledajte cene
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/portal/porudzbine/${order.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {order.orderNumber}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground">
                      {order.createdAt.toLocaleDateString("sr-Latn-RS", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[0.6rem]">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {formatEur(order.totalEur)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Profile + Account */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-6">
            <h2 className="text-lg font-semibold text-foreground">Profil</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ime, telefon, lozinka.
            </p>
            <div className="mt-4">
              <ButtonLink href="/portal/profil" size="sm" variant="outline">
                Izmeni profil
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/80 p-6">
            <h2 className="text-lg font-semibold text-foreground">Nalog</h2>
            <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-4">
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
