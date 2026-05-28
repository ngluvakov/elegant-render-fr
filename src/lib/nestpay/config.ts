/**
 * config.ts — Banca Intesa Nestpay gateway configuration.
 *
 * Reads environment variables once and exposes a typed config for the
 * rest of the Nestpay module. Throws at first read when required
 * variables are missing so server actions fail fast with a clear
 * message instead of producing an invalid POST that the bank rejects
 * with an opaque hash error.
 *
 * Used by: client.ts, status-query.ts, server/actions/nestpay
 */

export type NestpayMode = "test" | "live";
export type NestpayTranType = "Auth" | "PreAuth";

export type NestpayConfig = {
  mode: NestpayMode;
  clientId: string;
  storeKey: string;
  baseUrl: string;
  queryUrl: string;
  queryUsername: string;
  queryPassword: string;
  tranType: NestpayTranType;
  oidPrefix: string;
};

let cached: NestpayConfig | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[nestpay] ${name} is not configured. Add it to the Vercel project env.`,
    );
  }
  return value;
}

export function getNestpayConfig(): NestpayConfig {
  if (cached) return cached;

  const mode: NestpayMode =
    process.env.NEXT_PUBLIC_NESTPAY_MODE === "live" ? "live" : "test";
  const tranType: NestpayTranType =
    process.env.NESTPAY_TRAN_TYPE === "PreAuth" ? "PreAuth" : "Auth";

  cached = {
    mode,
    clientId: requireEnv("NESTPAY_CLIENT_ID"),
    storeKey: requireEnv("NESTPAY_STORE_KEY"),
    baseUrl: requireEnv("NESTPAY_BASE_URL"),
    queryUrl: requireEnv("NESTPAY_QUERY_URL"),
    queryUsername: process.env.NESTPAY_QUERY_USERNAME ?? "",
    queryPassword: process.env.NESTPAY_QUERY_PASSWORD ?? "",
    tranType,
    oidPrefix: process.env.NESTPAY_OID_PREFIX ?? "ER-",
  };

  return cached;
}

// Test seam — lets unit tests inject a fake config without rebuilding
// the env. Production code should never call this.
export function __setNestpayConfigForTests(config: NestpayConfig | null): void {
  cached = config;
}
