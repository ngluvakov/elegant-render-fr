import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { JobApplicationForm } from "@/components/jobs/job-application-form";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Carrières",
  description:
    "Rejoignez l’équipe Elegant Render — artistes 3D, animateurs et spécialistes de la visualisation. Candidatez avec votre CV et votre portfolio.",
  path: "/career",
  keywords: [
    "emploi artiste 3D",
    "carrières visualisation architecturale",
    "offres d’emploi archviz",
  ],
});

const HIRING_STEPS = [
  {
    title: "1. Candidature",
    text: "Remplissez le formulaire, joignez votre CV et votre portfolio. Cinq minutes, sans créer de compte.",
  },
  {
    title: "2. Examen du portfolio",
    text: "Nous regardons d’abord votre travail — ce que vous savez produire compte davantage que le dossier.",
  },
  {
    title: "3. Un échange",
    text: "Un court appel sur votre expérience, vos outils et ce sur quoi vous souhaitez travailler.",
  },
  {
    title: "4. Exercice pratique",
    text: "Une petite scène réaliste issue de notre production.",
  },
];

export default function CareerPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/career",
            name: "Carrières chez Elegant Render",
            description:
              "Candidature spontanée pour artistes 3D, animateurs et spécialistes de la visualisation.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Carrières", path: "/career" },
          ]),
        ]}
      />

      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-20 md:pt-28">
        <p className="section-kicker">Carrières</p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Créez des espaces dont on tombe amoureux
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          Nous sommes un studio de visualisation architecturale en pleine
          croissance, au service de clients partout en France — intérieurs,
          extérieurs, visites 360°, animations et retouche assistée par IA.
          Si c’est le travail que vous voulez faire au quotidien, candidatez
          ci-dessous : le formulaire prend quelques minutes et votre
          portfolio parle pour vous.
        </p>
      </div>

      <section className="py-16">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HIRING_STEPS.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border/70 bg-card/80 p-6"
              >
                <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {step.title}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto w-full max-w-3xl px-6">
          <h2 className="text-3xl text-foreground">Candidature</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Les champs marqués d’un * sont obligatoires. Nous répondons à
            chaque candidature.
          </p>
          <div className="mt-10">
            <JobApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
