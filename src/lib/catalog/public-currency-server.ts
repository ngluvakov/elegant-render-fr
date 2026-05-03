import { headers } from "next/headers";
import {
  getDisplayCurrencyForCountry,
  type DisplayCurrency,
} from "@/lib/catalog/display-currency";

export async function getPublicDisplayCurrency(): Promise<DisplayCurrency> {
  const countryCode = (await headers()).get("x-vercel-ip-country");
  return getDisplayCurrencyForCountry(countryCode);
}
