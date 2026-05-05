import { buildLlmsFullTxt } from "@/lib/llms";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const pricingCatalog = await getPublishedPricingCatalog();

  return new Response(buildLlmsFullTxt(pricingCatalog.categories), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
