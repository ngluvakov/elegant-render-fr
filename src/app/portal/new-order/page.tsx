import { redirect } from "next/navigation";

// `/portal/new-order` was the legacy "confirm order" page that
// AI-credit + configurator shortcuts pushed into after stashing a quote.
// Everything now goes through `/checkout`, which handles guests, presents
// the withdrawal waiver alongside the final total in the buyer's
// currency, and pre-fills buyer info for logged-in users. This route
// stays only to catch bookmarked links and in-flight tabs — the
// sessionStorage stash survives the same-tab redirect.
export default function NovaPorudzbina(): never {
  redirect("/checkout");
}
