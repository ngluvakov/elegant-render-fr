import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getAiEditType,
  getAiEngineLabelForGeneration,
} from "@/lib/ai-studio/catalog";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "AI Studio generacije",
  description:
    "Admin pregled AI Studio generacija, korisnika, statusa i potrošnje kredita.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAiStudioPage() {
  await requirePermission("USAGE_VIEW");
  const generations = await prisma.aiGeneration.findMany({
    include: {
      user: { select: { name: true, email: true } },
      referenceImages: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const now = new Date();
  const rows = await Promise.all(
    generations.map(async (generation) => {
      let resultUrl: string | null = null;
      let inputUrl: string | null = null;
      let maskUrl: string | null = null;
      let providerOutputUrl: string | null = null;
      let workZoneOverlayUrl: string | null = null;
      let referenceUrls: string[] = [];
      if (generation.expiresAt > now) {
        if (generation.resultStoragePath) {
          const { data } = await getSupabaseAdmin().storage
            .from("order-files")
            .createSignedUrl(generation.resultStoragePath, 60 * 30);
          resultUrl = data?.signedUrl ?? null;
        }
        if (generation.inputStoragePath) {
          const { data } = await getSupabaseAdmin().storage
            .from("order-files")
            .createSignedUrl(generation.inputStoragePath, 60 * 30);
          inputUrl = data?.signedUrl ?? null;
        }
        if (generation.maskStoragePath) {
          const { data } = await getSupabaseAdmin().storage
            .from("order-files")
            .createSignedUrl(generation.maskStoragePath, 60 * 30);
          maskUrl = data?.signedUrl ?? null;
        }
        if (generation.providerOutputStoragePath) {
          const { data } = await getSupabaseAdmin().storage
            .from("order-files")
            .createSignedUrl(generation.providerOutputStoragePath, 60 * 30);
          providerOutputUrl = data?.signedUrl ?? null;
        }
        if (
          generation.editType === "object_insertion" &&
          generation.maskStoragePath
        ) {
          workZoneOverlayUrl = `/api/admin/ai-studio/work-zone/${generation.id}`;
        }
        const references =
          generation.referenceImages.length > 0
            ? generation.referenceImages
            : generation.referenceStoragePath
              ? [{ storagePath: generation.referenceStoragePath }]
              : [];
        referenceUrls = (
          await Promise.all(
            references.map(async (reference) => {
              const { data } = await getSupabaseAdmin().storage
                .from("order-files")
                .createSignedUrl(reference.storagePath, 60 * 30);
              return data?.signedUrl ?? null;
            }),
          )
        ).filter((url): url is string => Boolean(url));
      }
      return {
        generation,
        resultUrl,
        inputUrl,
        maskUrl,
        providerOutputUrl,
        workZoneOverlayUrl,
        referenceUrls,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-foreground md:text-4xl">
          AI Studio generacije
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Admin pregled svih AI obrada, promptova, engine-a, grešaka i fajlova dok
          nisu istekli.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-border/60 bg-secondary/50 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Korisnik</th>
                <th className="px-4 py-3">Obrada</th>
                <th className="px-4 py-3">Engine</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Krediti</th>
                <th className="px-4 py-3">Prompt</th>
                <th className="px-4 py-3">Fajlovi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({
                generation,
                resultUrl,
                inputUrl,
                maskUrl,
                providerOutputUrl,
                workZoneOverlayUrl,
                referenceUrls,
              }) => (
                <tr
                  key={generation.id}
                  className="border-b border-border/40 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {generation.user.name ?? "Korisnik"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {generation.user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {getAiEditType(generation.editType).label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {generation.createdAt.toLocaleDateString("sr-RS")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {getAiEngineLabelForGeneration(
                        generation.provider,
                        generation.model,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {generation.model}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                      {generation.status}
                    </span>
                    {generation.errorMessage && (
                      <p className="mt-1 max-w-xs text-xs text-destructive">
                        {generation.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {generation.unitsCharged / 2}
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-sm truncate text-muted-foreground">
                      {generation.prompt || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {inputUrl && (
                        <a
                          href={inputUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Original
                        </a>
                      )}
                      {resultUrl && (
                        <a
                          href={resultUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Rezultat
                        </a>
                      )}
                      {providerOutputUrl && (
                        <a
                          href={providerOutputUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Provider output
                        </a>
                      )}
                      {maskUrl && (
                        <a
                          href={maskUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Maska
                        </a>
                      )}
                      {referenceUrls.length > 0 && (
                        <a
                          href={referenceUrls[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          {referenceUrls.length > 1
                            ? `Reference (${referenceUrls.length})`
                            : "Referenca"}
                        </a>
                      )}
                      {!inputUrl &&
                        !resultUrl &&
                        !providerOutputUrl &&
                        referenceUrls.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Isteklo
                        </span>
                      )}
                    </div>
                    {(inputUrl || referenceUrls[0] || maskUrl || providerOutputUrl || resultUrl) && (
                      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-6">
                        <DiagnosticThumb label="Original" url={inputUrl} />
                        <DiagnosticThumb label="Referenca" url={referenceUrls[0] ?? null} />
                        <DiagnosticThumb label="Maska" url={maskUrl} />
                        <DiagnosticThumb label="Work zona" url={workZoneOverlayUrl} />
                        <DiagnosticThumb label="Raw AI" url={providerOutputUrl} />
                        <DiagnosticThumb label="Final" url={resultUrl} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Još nema AI generacija.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DiagnosticThumb({ label, url }: { label: string; url: string | null }) {
  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-lg border border-border/30 bg-background/60"
      aria-disabled={!url}
    >
      <div className="flex aspect-square items-center justify-center bg-secondary/40">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={`AI Studio dijagnostika - ${label}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="px-2 text-center text-[0.62rem] text-muted-foreground">
            Nema
          </span>
        )}
      </div>
      <p className="truncate px-2 py-1 text-[0.62rem] font-semibold text-muted-foreground">
        {label}
      </p>
    </a>
  );
}
