import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getAiEditType,
  getAiEngineLabelForGeneration,
} from "@/lib/ai-studio/catalog";

export const metadata: Metadata = {
  title: "AI Studio generacije",
  robots: { index: false, follow: false },
};

export default async function AdminAiStudioPage() {
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
      return { generation, resultUrl, inputUrl, referenceUrls };
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
              {rows.map(({ generation, resultUrl, inputUrl, referenceUrls }) => (
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
                      {referenceUrls.length > 0 && (
                        <a
                          href={referenceUrls[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          {referenceUrls.length > 1
                            ? `Objekti (${referenceUrls.length})`
                            : "Objekat"}
                        </a>
                      )}
                      {!inputUrl && !resultUrl && referenceUrls.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Isteklo
                        </span>
                      )}
                    </div>
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
