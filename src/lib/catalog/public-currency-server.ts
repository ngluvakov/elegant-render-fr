import { headers } from "next/headers";
import {
  getDisplayCurrencyForCountry,
  type DisplayCurrency,
} from "@/lib/catalog/display-currency";

export async function getPublicCountryCode(): Promise<string | null> {
  const countryCode = (await headers()).get("x-vercel-ip-country");
  const normalized = countryCode?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export async function getPublicDisplayCurrency(): Promise<DisplayCurrency> {
  const countryCode = await getPublicCountryCode();
  return getDisplayCurrencyForCountry(countryCode);
}
