import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { JobApplicationForm } from "@/components/jobs/job-application-form";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Career",
  description:
    "Join the Elegant Render team — 3D artists, animators and visualization specialists. Apply with your CV and portfolio.",
  path: "/career",
  keywords: [
    "3D artist job",
    "architectural visualization careers",
    "archviz jobs",
  ],
});

const HIRING_STEPS = [
  {
    title: "1. Apply",
    text: "Fill in the form, attach your CV and portfolio. Five minutes, no login.",
  },
  {
    title: "2. Portfolio review",
    text: "We look at your work first — what you can produce matters more than the paperwork.",
  },
  {
    title: "3. A conversation",
    text: "A short call about your experience, tools and what you want to work on.",
  },
  {
    title: "4. Paid test task",
    text: "A small, realistic scene from our production — paid whether or not we continue.",
  },
];

export default function CareerPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/career",
            name: "Career at Elegant Render",
            description:
              "Open application for 3D artists, animators and visualization specialists.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Career", path: "/career" },
          ]),
        ]}
      />

      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-20 md:pt-28">
        <p className="section-kicker">Career</p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Build spaces people fall in love with
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          We are a growing architectural visualization studio working for
          clients across the world — interiors, exteriors, 360 tours,
          animations and AI-assisted editing. If that is the work you want to
          do every day, apply below: the form takes a few minutes and your
          portfolio does most of the talking.
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
          <h2 className="text-3xl text-foreground">Application</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Fields marked with * are required. We reply to every application.
          </p>
          <div className="mt-10">
            <JobApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
