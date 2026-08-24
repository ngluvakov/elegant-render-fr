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
import { requirePagePermission } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Statistiques — Admin",
  description:
    "Hub admin des liens vers les tableaux de bord Google, LinkedIn, Vercel, PostHog, Sentry et SEO.",
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
    description: "Entonnoirs, comportement dans le configurateur, demandes, paiement et événements AI Studio.",
    envName: "POSTHOG_DASHBOARD_URL",
    href: dashboardUrl("POSTHOG_DASHBOARD_URL"),
    icon: BarChart3,
    note: "Le meilleur endroit pour l’analytique produit et les conversions.",
  },
  {
    title: "Sentry",
    description: "Erreurs, performances, stack traces et replay de session lorsque l’utilisateur a donné son consentement.",
    envName: "SENTRY_DASHBOARD_URL",
    href: dashboardUrl("SENTRY_DASHBOARD_URL"),
    icon: ShieldAlert,
    note: "À consulter en premier lorsqu’un utilisateur signale un problème.",
  },
  {
    title: "Vercel Web Analytics",
    description: "Pages vues, référents, appareils, pays et trafic public sans tableau de bord interne séparé.",
    envName: "VERCEL_WEB_ANALYTICS_URL",
    href: dashboardUrl("VERCEL_WEB_ANALYTICS_URL"),
    icon: LineChart,
    note: "Aperçu rapide de la provenance des visites.",
  },
  {
    title: "Vercel Speed Insights",
    description: "Core Web Vitals par route : LCP, INP, CLS, FCP et TTFB issus de visites réelles.",
    envName: "VERCEL_SPEED_INSIGHTS_URL",
    href: dashboardUrl("VERCEL_SPEED_INSIGHTS_URL"),
    icon: Gauge,
    note: "À utiliser avant des évolutions UX et SEO importantes.",
  },
  {
    title: "Vercel Project",
    description: "Déploiements, logs d’exécution, logs de build et état général de la production.",
    envName: "VERCEL_PROJECT_DASHBOARD_URL",
    href: dashboardUrl("VERCEL_PROJECT_DASHBOARD_URL"),
    icon: Server,
    note: "Pour vérifier les déploiements et les logs d’exécution.",
  },
  {
    title: "Google Analytics 4",
    description: "Tableau de bord GA4 pour mesurer le trafic organique et les campagnes après le lancement.",
    envName: "GOOGLE_ANALYTICS_DASHBOARD_URL",
    href: dashboardUrl("GOOGLE_ANALYTICS_DASHBOARD_URL"),
    icon: BarChart3,
    note:
      process.env.NEXT_PUBLIC_GA4_ENABLED === "true"
        ? "Le tag n’est actif qu’après le consentement analytique."
        : process.env.NEXT_PUBLIC_GTM_ENABLED === "true"
          ? "GA4 passe par GTM ; le tag direct est désactivé."
        : "Préparé ; le tag est désactivé jusqu’au lancement.",
  },
  {
    title: "Google Tag Manager",
    description: "Conteneur GTM pour les tags, les événements dataLayer et les futures intégrations marketing.",
    envName: "GOOGLE_TAG_MANAGER_DASHBOARD_URL",
    href: dashboardUrl("GOOGLE_TAG_MANAGER_DASHBOARD_URL"),
    icon: BarChart3,
    note:
      process.env.NEXT_PUBLIC_GTM_ENABLED === "true"
        ? "Le conteneur n’est actif qu’après le consentement analytique."
        : "Préparé ; le conteneur est désactivé jusqu’au lancement.",
  },
  {
    title: "LinkedIn Campaign Manager",
    description: "Insight Tag, campagnes LinkedIn, audiences et état du suivi des conversions.",
    envName: "LINKEDIN_CAMPAIGN_MANAGER_URL",
    href: dashboardUrl("LINKEDIN_CAMPAIGN_MANAGER_URL"),
    icon: BarChart3,
    note: "L’Insight Tag (partner ID 9178042) ne se charge qu’après le consentement marketing.",
  },
  {
    title: "Google Search Console",
    description: "Indexation, requêtes de recherche, positions, sitemap et signaux SEO techniques.",
    envName: "GOOGLE_SEARCH_CONSOLE_URL",
    href: dashboardUrl("GOOGLE_SEARCH_CONSOLE_URL"),
    icon: Search,
    note: "À configurer dès que le domaine est connecté.",
  },
  {
    title: "Bing Webmaster",
    description: "Indexation Bing, sitemap et signaux SEO supplémentaires pour l’écosystème IA/recherche.",
    envName: "BING_WEBMASTER_URL",
    href: dashboardUrl("BING_WEBMASTER_URL"),
    icon: Search,
    note: "Canal facultatif, mais utile pour une visibilité plus large.",
  },
];

export default async function AdminAnalyticsPage() {
  await requirePagePermission("ANALYTICS_VIEW");
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
            Statistiques et suivi du site
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Un seul endroit pour les tableaux de bord externes : entonnoir produit, erreurs, performances, SEO et logs de déploiement. Les liens sont réservés aux admins et lus depuis les variables d’environnement du serveur.
          </p>
        </div>
        <Badge className="w-fit bg-secondary text-foreground">
          {configuredCount}/{dashboardLinks.length} liens configurés
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SignalCard
          icon={BarChart3}
          title="Entonnoir PostHog"
          body="Événements du configurateur, des demandes, de la commande, du paiement et d’AI Studio, sans données personnelles."
        />
        <SignalCard
          icon={ShieldAlert}
          title="Erreurs Sentry"
          body="Erreurs client et serveur, tracing et replay lorsque le consentement utilisateur existe."
        />
        <SignalCard
          icon={Activity}
          title="Métriques Vercel"
          body="Pages vues et Core Web Vitals comme signaux agrégés de l’expérience en production."
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold font-mono uppercase tracking-[0.08em] text-muted-foreground">
          Liens vers les tableaux de bord
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {dashboardLinks.map((item) => (
            <DashboardCard key={item.envName} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border/40 bg-card/80 p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Comment l’utiliser
        </h2>
        <div className="mt-4 grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
          <p>
            Pour les décisions marketing, ouvrez d’abord Vercel Web Analytics : les pages les plus visitées, les sources de trafic et les pays des visiteurs montrent où renforcer le contenu.
          </p>
          <p>
            Pour les conversions, ouvrez PostHog : suivez le parcours de la visite au configurateur, à la demande rapide, à la commande et au paiement.
          </p>
          <p>
            En cas de panne ou de problème signalé, ouvrez d’abord Sentry, puis les logs Vercel si le flux côté serveur doit être vérifié.
          </p>
          <p>
            Pour les priorités SEO et UX, utilisez Speed Insights : des routes publiques lentes affectent directement la conversion et la portée organique.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border/40 bg-card/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Mode de mesure GA4
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Google Analytics 4 est configuré via Google Tag Manager. Le tag GA4 direct reste désactivé pour éviter les pages vues en double.
            </p>
          </div>
          <Badge
            className={
              ga4Enabled
                ? "bg-accent/10 text-foreground"
                : "bg-secondary text-muted-foreground"
            }
          >
            {ga4Enabled
              ? "GA4 direct activé"
              : gtmEnabled
                ? "GA4 via GTM"
                : "GA4 direct désactivé"}
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ReadinessItem
            ready={ga4MeasurementReady}
            title="ID de mesure"
            detail={
              ga4MeasurementReady
                ? "NEXT_PUBLIC_GA4_MEASUREMENT_ID est défini."
                : "Ajoutez l’ID du flux de données web GA4, au format G-XXXXXXXXXX."
            }
          />
          <ReadinessItem
            ready={ga4DashboardReady}
            title="Lien du tableau de bord"
            detail={
              ga4DashboardReady
                ? "GOOGLE_ANALYTICS_DASHBOARD_URL est définie."
                : "Ajoutez l’URL du tableau de bord GA4 pour un accès admin rapide."
            }
          />
          <ReadinessItem
            ready
            title="Conditionné au consentement"
            detail="Le conteneur GTM et la mesure GA4 ne se chargent qu’après le consentement analytique."
          />
          <ReadinessItem
            ready={!ga4Enabled}
            title="Tag GA4 direct"
            detail={
              ga4Enabled
                ? "Le tag GA4 direct est activé ; vérifiez que GTM n’envoie pas la même page vue."
                : "Correct : le tag direct est désactivé car GA4 passe par GTM."
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-border/40 bg-card/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Préparation GTM au lancement
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Google Tag Manager est prêt dans le code. Le conteneur ne se charge que si la variable d’environnement est activée et que le visiteur accepte l’analytique.
            </p>
          </div>
          <Badge
            className={
              gtmEnabled
                ? "bg-accent/10 text-foreground"
                : "bg-secondary text-muted-foreground"
            }
          >
            {gtmEnabled ? "GTM activé" : "GTM désactivé jusqu’au lancement"}
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ReadinessItem
            ready={gtmContainerReady}
            title="ID du conteneur"
            detail={
              gtmContainerReady
                ? "NEXT_PUBLIC_GTM_CONTAINER_ID est défini."
                : "Ajoutez l’ID du conteneur web GTM, au format GTM-XXXXXXX."
            }
          />
          <ReadinessItem
            ready={gtmDashboardReady}
            title="Lien du tableau de bord"
            detail={
              gtmDashboardReady
                ? "GOOGLE_TAG_MANAGER_DASHBOARD_URL est définie."
                : "Ajoutez l’URL du tableau de bord GTM pour un accès admin rapide."
            }
          />
          <ReadinessItem
            ready
            title="Conditionné au consentement"
            detail="Le conteneur GTM ne se charge qu’après le consentement analytique."
          />
          <ReadinessItem
            ready={!gtmEnabled}
            title="Statut avant mise en ligne"
            detail={
              gtmEnabled
                ? "Actuellement activé ; vérifiez que le conteneur est prêt."
                : "Correct : le conteneur est préparé, mais il ne mesure pas les visites de test."
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
    <div className="rounded-lg border border-border/40 bg-card/80 p-4">
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
              ? "bg-accent/10 text-foreground"
              : "bg-secondary text-muted-foreground"
          }
        >
          {item.href ? "Configuré" : `${item.envName} manquante`}
        </Badge>
        <span className="text-xs text-muted-foreground">{item.note}</span>
      </div>
    </>
  );

  if (!item.href) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-card/50 p-5 opacity-80">
        {content}
      </div>
    );
  }

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-lg border border-border/40 bg-card/80 p-5 transition-all hover:border-border hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
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
              ? "bg-accent/10 text-foreground"
              : "bg-secondary text-muted-foreground"
          }
        >
          {ready ? "OK" : "En attente"}
        </Badge>
      </div>
    </div>
  );
}
