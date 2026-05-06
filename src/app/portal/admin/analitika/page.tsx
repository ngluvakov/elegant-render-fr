import type { Metadata } from "next";
import {
  Activity,
  BarChart3,
  ExternalLink,
  Gauge,
  LineChart,
  Search,
  Server,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Analitika — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type DashboardLink = {
  title: string;
  description: string;
  envName: string;
  href: string | null;
  icon: LucideIcon;
  note: string;
};

function dashboardUrl(envName: string): string | null {
  const value = process.env[envName]?.trim();
  if (!value) return null;
  if (!value.startsWith("https://") && !value.startsWith("http://")) return null;
  return value;
}

const dashboardLinks: DashboardLink[] = [
  {
    title: "PostHog",
    description: "Funneli, ponašanje u konfiguratoru, upiti, checkout i AI Studio događaji.",
    envName: "POSTHOG_DASHBOARD_URL",
    href: dashboardUrl("POSTHOG_DASHBOARD_URL"),
    icon: BarChart3,
    note: "Najbolje mesto za product analytics i konverzije.",
  },
  {
    title: "Sentry",
    description: "Greške, performanse, stack trace i session replay kada je korisnik dao saglasnost.",
    envName: "SENTRY_DASHBOARD_URL",
    href: dashboardUrl("SENTRY_DASHBOARD_URL"),
    icon: ShieldAlert,
    note: "Prvo proveriti kada korisnik prijavi problem.",
  },
  {
    title: "Vercel Web Analytics",
    description: "Pageviews, referreri, uređaji, zemlje i javni saobraćaj bez posebnog internog dashboarda.",
    envName: "VERCEL_WEB_ANALYTICS_URL",
    href: dashboardUrl("VERCEL_WEB_ANALYTICS_URL"),
    icon: LineChart,
    note: "Brz pregled odakle dolaze posete.",
  },
  {
    title: "Vercel Speed Insights",
    description: "Core Web Vitals po ruti: LCP, INP, CLS, FCP i TTFB na realnim posetama.",
    envName: "VERCEL_SPEED_INSIGHTS_URL",
    href: dashboardUrl("VERCEL_SPEED_INSIGHTS_URL"),
    icon: Gauge,
    note: "Koristiti pre većih UX i SEO izmena.",
  },
  {
    title: "Vercel Project",
    description: "Deployments, runtime logs, build logs i opšte stanje produkcije.",
    envName: "VERCEL_PROJECT_DASHBOARD_URL",
    href: dashboardUrl("VERCEL_PROJECT_DASHBOARD_URL"),
    icon: Server,
    note: "Za proveru deploy-a i runtime logova.",
  },
  {
    title: "Google Analytics 4",
    description: "GA4 dashboard za post-live merenje organskog i kampanjskog saobraćaja.",
    envName: "GOOGLE_ANALYTICS_DASHBOARD_URL",
    href: dashboardUrl("GOOGLE_ANALYTICS_DASHBOARD_URL"),
    icon: BarChart3,
    note:
      process.env.NEXT_PUBLIC_GA4_ENABLED === "true"
        ? "Tag je aktivan samo posle analytics consent-a."
        : "Pripremljeno; tag je isključen do live puštanja.",
  },
  {
    title: "Google Search Console",
    description: "Indeksiranje, search queries, pozicije, sitemap i tehnički SEO signali.",
    envName: "GOOGLE_SEARCH_CONSOLE_URL",
    href: dashboardUrl("GOOGLE_SEARCH_CONSOLE_URL"),
    icon: Search,
    note: "Podesiti čim domen bude povezan.",
  },
  {
    title: "Bing Webmaster",
    description: "Bing indeksiranje, sitemap i dodatni SEO signali za AI/search ekosistem.",
    envName: "BING_WEBMASTER_URL",
    href: dashboardUrl("BING_WEBMASTER_URL"),
    icon: Search,
    note: "Opcioni kanal, ali koristan za širi discovery.",
  },
];

export default function AdminAnalyticsPage() {
  const configuredCount = dashboardLinks.filter((item) => item.href).length;
  const ga4Enabled = process.env.NEXT_PUBLIC_GA4_ENABLED === "true";
  const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? "";
  const ga4MeasurementReady = /^G-[A-Z0-9]+$/.test(ga4MeasurementId);
  const ga4DashboardReady = Boolean(dashboardUrl("GOOGLE_ANALYTICS_DASHBOARD_URL"));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground md:text-4xl">
            Analitika i praćenje sajta
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Jedno mesto za spoljne dashboarde: product funnel, greške,
            performanse, SEO i deploy logove. Linkovi su admin-only i čitaju se
            iz server env varijabli.
          </p>
        </div>
        <Badge className="w-fit bg-secondary text-foreground">
          {configuredCount}/{dashboardLinks.length} linkova podešeno
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SignalCard
          icon={BarChart3}
          title="PostHog funnel"
          body="Konfigurator, upiti, checkout, plaćanje i AI Studio događaji bez PII podataka."
        />
        <SignalCard
          icon={ShieldAlert}
          title="Sentry greške"
          body="Client i server greške, tracing i replay kada postoji korisnička saglasnost."
        />
        <SignalCard
          icon={Activity}
          title="Vercel metrika"
          body="Pageviews i Core Web Vitals kao agregatni signali produkcionog iskustva."
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Dashboard linkovi
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {dashboardLinks.map((item) => (
            <DashboardCard key={item.envName} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/40 bg-card/80 p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Kako da se koristi
        </h2>
        <div className="mt-4 grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
          <p>
            Za marketing odluke prvo otvoriti Vercel Web Analytics: najposećenije
            stranice, izvori saobraćaja i zemlje posetilaca pokazuju gde treba
            pojačati sadržaj.
          </p>
          <p>
            Za konverzije otvoriti PostHog: gledati putanju od posete ka
            konfiguratoru, brzom upitu, checkout-u i plaćanju.
          </p>
          <p>
            Za padove i prijavljene probleme prvo otvoriti Sentry, pa Vercel
            logs ako treba proveriti server-side tok.
          </p>
          <p>
            Za SEO i UX prioritete koristiti Speed Insights: spore javne rute
            direktno utiču na konverziju i organski reach.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/40 bg-card/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              GA4 priprema za live
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Google Analytics 4 je spreman u kodu, ali se ne učitava dok nije
              eksplicitno uključen env prekidačem i dok posetilac ne prihvati
              analitiku.
            </p>
          </div>
          <Badge
            className={
              ga4Enabled
                ? "bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]"
                : "bg-secondary text-muted-foreground"
            }
          >
            {ga4Enabled ? "GA4 uključen" : "GA4 isključen do live-a"}
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ReadinessItem
            ready={ga4MeasurementReady}
            title="Measurement ID"
            detail={
              ga4MeasurementReady
                ? "NEXT_PUBLIC_GA4_MEASUREMENT_ID je podešen."
                : "Dodati GA4 Web Data Stream ID, format G-XXXXXXXXXX."
            }
          />
          <ReadinessItem
            ready={ga4DashboardReady}
            title="Dashboard link"
            detail={
              ga4DashboardReady
                ? "GOOGLE_ANALYTICS_DASHBOARD_URL je podešen."
                : "Dodati GA4 dashboard URL za brzi admin pristup."
            }
          />
          <ReadinessItem
            ready
            title="Consent gating"
            detail="GA4 komponenta se učitava tek nakon analytics saglasnosti."
          />
          <ReadinessItem
            ready={!ga4Enabled}
            title="Pre-live stanje"
            detail={
              ga4Enabled
                ? "Aktivno je uključeno; proveriti da li je domen već live."
                : "Ispravno: tag je pripremljen, ali ne meri test posete."
            }
          />
        </div>
      </section>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ item }: { item: DashboardLink }) {
  const Icon = item.icon;
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/70 text-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        </div>
        {item.href ? (
          <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          className={
            item.href
              ? "bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]"
              : "bg-secondary text-muted-foreground"
          }
        >
          {item.href ? "Podešeno" : `Nedostaje ${item.envName}`}
        </Badge>
        <span className="text-xs text-muted-foreground">{item.note}</span>
      </div>
    </>
  );

  if (!item.href) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-5 opacity-80">
        {content}
      </div>
    );
  }

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-border/40 bg-card/80 p-5 transition-all hover:border-border hover:shadow-[0_8px_24px_rgba(28,26,25,0.06)]"
    >
      {content}
    </a>
  );
}

function ReadinessItem({
  ready,
  title,
  detail,
}: {
  ready: boolean;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {detail}
          </p>
        </div>
        <Badge
          className={
            ready
              ? "bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]"
              : "bg-secondary text-muted-foreground"
          }
        >
          {ready ? "OK" : "Čeka"}
        </Badge>
      </div>
    </div>
  );
}
