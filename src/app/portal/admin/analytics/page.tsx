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
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Analytics — Admin",
  description:
    "Admin hub for Google, LinkedIn, Vercel, PostHog, Sentry, and SEO dashboard links.",
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
    description: "Funnels, configurator behavior, inquiries, checkout, and AI Studio events.",
    envName: "POSTHOG_DASHBOARD_URL",
    href: dashboardUrl("POSTHOG_DASHBOARD_URL"),
    icon: BarChart3,
    note: "Best place for product analytics and conversions.",
  },
  {
    title: "Sentry",
    description: "Errors, performance, stack traces, and session replay when the user has consented.",
    envName: "SENTRY_DASHBOARD_URL",
    href: dashboardUrl("SENTRY_DASHBOARD_URL"),
    icon: ShieldAlert,
    note: "Check this first when a user reports a problem.",
  },
  {
    title: "Vercel Web Analytics",
    description: "Pageviews, referrers, devices, countries, and public traffic without a separate internal dashboard.",
    envName: "VERCEL_WEB_ANALYTICS_URL",
    href: dashboardUrl("VERCEL_WEB_ANALYTICS_URL"),
    icon: LineChart,
    note: "Quick overview of where visits come from.",
  },
  {
    title: "Vercel Speed Insights",
    description: "Core Web Vitals by route: LCP, INP, CLS, FCP, and TTFB from real visits.",
    envName: "VERCEL_SPEED_INSIGHTS_URL",
    href: dashboardUrl("VERCEL_SPEED_INSIGHTS_URL"),
    icon: Gauge,
    note: "Use before larger UX and SEO changes.",
  },
  {
    title: "Vercel Project",
    description: "Deployments, runtime logs, build logs, and overall production health.",
    envName: "VERCEL_PROJECT_DASHBOARD_URL",
    href: dashboardUrl("VERCEL_PROJECT_DASHBOARD_URL"),
    icon: Server,
    note: "Za proveru deploy-a i runtime logova.",
  },
  {
    title: "Google Analytics 4",
    description: "GA4 dashboard for post-launch organic and campaign traffic measurement.",
    envName: "GOOGLE_ANALYTICS_DASHBOARD_URL",
    href: dashboardUrl("GOOGLE_ANALYTICS_DASHBOARD_URL"),
    icon: BarChart3,
    note:
      process.env.NEXT_PUBLIC_GA4_ENABLED === "true"
        ? "The tag is active only after analytics consent."
        : process.env.NEXT_PUBLIC_GTM_ENABLED === "true"
          ? "GA4 runs through GTM; the direct tag is disabled."
        : "Prepared; the tag is disabled until launch.",
  },
  {
    title: "Google Tag Manager",
    description: "GTM container for tags, dataLayer events, and future marketing integrations.",
    envName: "GOOGLE_TAG_MANAGER_DASHBOARD_URL",
    href: dashboardUrl("GOOGLE_TAG_MANAGER_DASHBOARD_URL"),
    icon: BarChart3,
    note:
      process.env.NEXT_PUBLIC_GTM_ENABLED === "true"
        ? "The container is active only after analytics consent."
        : "Prepared; the container is disabled until launch.",
  },
  {
    title: "LinkedIn Campaign Manager",
    description: "Insight Tag, LinkedIn campaigns, audiences, and conversion tracking status.",
    envName: "LINKEDIN_CAMPAIGN_MANAGER_URL",
    href: dashboardUrl("LINKEDIN_CAMPAIGN_MANAGER_URL"),
    icon: BarChart3,
    note: "Insight Tag partner ID 9178042 loads only after marketing consent.",
  },
  {
    title: "Google Search Console",
    description: "Indexing, search queries, positions, sitemap, and technical SEO signals.",
    envName: "GOOGLE_SEARCH_CONSOLE_URL",
    href: dashboardUrl("GOOGLE_SEARCH_CONSOLE_URL"),
    icon: Search,
    note: "Set this up as soon as the domain is connected.",
  },
  {
    title: "Bing Webmaster",
    description: "Bing indexing, sitemap, and additional SEO signals for the AI/search ecosystem.",
    envName: "BING_WEBMASTER_URL",
    href: dashboardUrl("BING_WEBMASTER_URL"),
    icon: Search,
    note: "Optional channel, but useful for broader discovery.",
  },
];

export default async function AdminAnalyticsPage() {
  await requirePermission("ANALYTICS_VIEW");
  const configuredCount = dashboardLinks.filter((item) => item.href).length;
  const ga4Enabled = process.env.NEXT_PUBLIC_GA4_ENABLED === "true";
  const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? "";
  const ga4MeasurementReady = /^G-[A-Z0-9]+$/.test(ga4MeasurementId);
  const ga4DashboardReady = Boolean(dashboardUrl("GOOGLE_ANALYTICS_DASHBOARD_URL"));
  const gtmEnabled = process.env.NEXT_PUBLIC_GTM_ENABLED === "true";
  const gtmContainerId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim() ?? "";
  const gtmContainerReady = /^GTM-[A-Z0-9]+$/.test(gtmContainerId);
  const gtmDashboardReady = Boolean(dashboardUrl("GOOGLE_TAG_MANAGER_DASHBOARD_URL"));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground md:text-4xl">
            Analytics and site tracking
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            One place for external dashboards: product funnel, errors,
            performance, SEO, and deploy logs. Links are admin-only and read from
            server environment variables.
          </p>
        </div>
        <Badge className="w-fit bg-secondary text-foreground">
          {configuredCount}/{dashboardLinks.length} links configured
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SignalCard
          icon={BarChart3}
          title="PostHog funnel"
          body="Configurator, inquiries, checkout, payment, and AI Studio events without PII."
        />
        <SignalCard
          icon={ShieldAlert}
          title="Sentry errors"
          body="Client and server errors, tracing, and replay when user consent exists."
        />
        <SignalCard
          icon={Activity}
          title="Vercel metrics"
          body="Pageviews and Core Web Vitals as aggregate signals of the production experience."
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Dashboard links
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {dashboardLinks.map((item) => (
            <DashboardCard key={item.envName} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/40 bg-card/80 p-5">
        <h2 className="text-lg font-semibold text-foreground">
          How to use it
        </h2>
        <div className="mt-4 grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
          <p>
            For marketing decisions, open Vercel Web Analytics first: the most visited
            pages, traffic sources, and visitor countries show where to
            strengthen content.
          </p>
          <p>
            For conversions, open PostHog: review the path from visit to
            configurator, quick inquiry, checkout, and payment.
          </p>
          <p>
            For outages and reported problems, open Sentry first, then Vercel
            logs if the server-side flow needs checking.
          </p>
          <p>
            For SEO and UX priorities, use Speed Insights: slow public routes
            directly affect conversion and organic reach.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/40 bg-card/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              GA4 measurement mode
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Google Analytics 4 is configured through Google Tag Manager. The direct
              GA4 tag stays disabled to avoid duplicate pageview events.
            </p>
          </div>
          <Badge
            className={
              ga4Enabled
                ? "bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]"
                : "bg-secondary text-muted-foreground"
            }
          >
            {ga4Enabled
              ? "Direct GA4 enabled"
              : gtmEnabled
                ? "GA4 preko GTM-a"
                : "GA4 direct disabled"}
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ReadinessItem
            ready={ga4MeasurementReady}
            title="Measurement ID"
            detail={
              ga4MeasurementReady
                ? "NEXT_PUBLIC_GA4_MEASUREMENT_ID is set."
                : "Dodati GA4 Web Data Stream ID, format G-XXXXXXXXXX."
            }
          />
          <ReadinessItem
            ready={ga4DashboardReady}
            title="Dashboard link"
            detail={
              ga4DashboardReady
                ? "GOOGLE_ANALYTICS_DASHBOARD_URL is set."
                : "Dodati GA4 dashboard URL za brzi admin pristup."
            }
          />
          <ReadinessItem
            ready
            title="Consent gating"
            detail="GTM container and GA4 measurement load only after analytics consent."
          />
          <ReadinessItem
            ready={!ga4Enabled}
            title="Direct GA4 tag"
            detail={
              ga4Enabled
                ? "Direct GA4 tag is enabled; check that GTM does not send the same pageview."
                : "Correct: the direct tag is disabled because GA4 runs through GTM."
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/40 bg-card/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              GTM priprema za live
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Google Tag Manager is ready in code. The container loads only
              when the env switch is enabled and the visitor accepts analytics.
            </p>
          </div>
          <Badge
            className={
              gtmEnabled
                ? "bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]"
                : "bg-secondary text-muted-foreground"
            }
          >
            {gtmEnabled ? "GTM enabled" : "GTM disabled until launch"}
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ReadinessItem
            ready={gtmContainerReady}
            title="Container ID"
            detail={
              gtmContainerReady
                ? "NEXT_PUBLIC_GTM_CONTAINER_ID is set."
                : "Dodati GTM Web Container ID, format GTM-XXXXXXX."
            }
          />
          <ReadinessItem
            ready={gtmDashboardReady}
            title="Dashboard link"
            detail={
              gtmDashboardReady
                ? "GOOGLE_TAG_MANAGER_DASHBOARD_URL is set."
                : "Dodati GTM dashboard URL za brzi admin pristup."
            }
          />
          <ReadinessItem
            ready
            title="Consent gating"
            detail="GTM container loads only after analytics consent."
          />
          <ReadinessItem
            ready={!gtmEnabled}
            title="Pre-live status"
            detail={
              gtmEnabled
                ? "It is currently enabled; check that the container is ready."
                : "Correct: the container is prepared, but it does not measure test visits."
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
          {item.href ? "Configured" : `Nedostaje ${item.envName}`}
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
          {ready ? "OK" : "Pending"}
        </Badge>
      </div>
    </div>
  );
}
