/**
 * sync.ts — What the platform tells the Iris CRM, mirroring the Bitrix24
 * sync one-to-one (server/bitrix/*): inquiry → lead, order → deal,
 * status → stage, comment/file → note on the deal.
 *
 * Every function is safe to call when Iris is off (no-op) and safe to
 * repeat (Iris dedupes on the event id). Callers wrap them in
 * `irisAfter(...)` so a slow or dead Iris never delays the user.
 *
 * Used by: server/actions/project-inquiry, order, admin, admin-manual-order,
 * comment; lib/order/status-machine.
 */
import { prisma } from "@/lib/db";
import { scoreInquiry } from "@/lib/spam-detection";
import type { OrderStatus } from "@/generated/prisma/client";
import { IrisError, irisEvent } from "./client";

function baseUrl(): string {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

/** Public pre-sales inquiry → Iris lead (+ contact by e-mail). */
export async function irisInquiry(inquiryId: string) {
  const inquiry = await prisma.projectInquiry.findUniqueOrThrow({
    where: { id: inquiryId },
    include: { files: { select: { id: true, fileName: true, fileSize: true } } },
  });
  const spam = scoreInquiry({
    contactName: inquiry.contactName,
    email: inquiry.email,
    phone: inquiry.phone,
    company: inquiry.company,
    message: inquiry.message,
    serviceType: inquiry.serviceType,
  });
  return irisEvent(`inquiry:${inquiry.id}`, {
    vrsta: "upit",
    upit: {
      id: inquiry.id,
      ime: inquiry.contactName,
      email: inquiry.email,
      telefon: inquiry.phone ?? undefined,
      firma: inquiry.company ?? undefined,
      drzava: inquiry.countryCode ?? undefined,
      grad: inquiry.city ?? undefined,
      poruka: inquiry.message,
      usluga: inquiry.serviceType ?? undefined,
      budzet: inquiry.budget ?? undefined,
      rok: inquiry.deadline ?? undefined,
      izvor: inquiry.source ?? undefined,
      putanja: inquiry.sourcePath ?? undefined,
      cta: inquiry.sourceLabel ?? undefined,
      // download goes through the admin route (needs an admin session on the site), so the link never expires
      fajlovi: inquiry.files.map((f) => ({ ime: f.fileName, velicina: f.fileSize, url: `${baseUrl()}/api/admin/inquiries/download?fileId=${f.id}` })),
      spam: spam.level === "likely_spam",
      razlozi: spam.level === "likely_spam" ? spam.reasons : undefined,
      url: `${baseUrl()}/portal/admin/inquiries`,
    },
  });
}

/** Order → Iris deal (+ contact from the buyer). Credit-only orders stay out of CRM, as with Bitrix. */
export async function irisNewOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, billingCompanyName: true, billingCountryCode: true } },
      items: {
        where: { kind: "service" },
        select: { productLabel: true, categoryLabel: true, totalEur: true },
      },
    },
  });
  if (order.items.length === 0) return null;

  return irisEvent(`order:${order.id}`, {
    vrsta: "porudzbina",
    porudzbina: {
      id: order.id,
      broj: order.orderNumber,
      naslov: order.items[0]?.productLabel ?? "Order",
      faza: order.status,
      iznos: order.premiumTotalEur ?? order.totalEur,
      valuta: "EUR",
      stavke: order.items.map((i) => ({ naziv: i.productLabel, kategorija: i.categoryLabel, iznos: i.totalEur })),
      napomena: order.customerNote ?? undefined,
      upitId: order.sourceInquiryId ?? undefined,
      url: `${baseUrl()}/portal/admin/orders/${order.id}`,
    },
    kupac: {
      id: order.user.id,
      ime: order.user.name ?? "Client",
      email: order.user.email,
      telefon: order.user.phone ?? undefined,
      firma: order.user.billingCompanyName ?? undefined,
      // country from the invoice (buyer or company), else the account's billing country
      drzava: order.buyerCountryCode ?? order.companyCountryCode ?? order.user.billingCountryCode ?? undefined,
      grad: order.buyerCity ?? undefined,
    },
  });
}

/**
 * Sends an order-scoped event; if Iris has never seen the order
 * (404 posao-nepoznat), sends the order first and retries once.
 */
async function withOrder(orderId: string, id: string, event: Record<string, unknown>) {
  try {
    return await irisEvent(id, event);
  } catch (err) {
    if (!(err instanceof IrisError) || err.greska !== "posao-nepoznat") throw err;
    const created = await irisNewOrder(orderId);
    if (!created) return null; // credit-only order — nothing to attach to
    return irisEvent(id, event);
  }
}

/** Order status change → deal stage (same vocabulary on both sides). */
export async function irisOrderStatus(orderId: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } });
  if (!order) return null;
  return withOrder(orderId, `status:${orderId}:${status}`, {
    vrsta: "faza",
    porudzbina: { id: orderId, broj: order.orderNumber, faza: status, url: `${baseUrl()}/portal/admin/orders/${orderId}` },
  });
}

/** Order comment → note on the deal; client comments are announced to the sales group. */
export async function irisComment(commentId: string) {
  const comment = await prisma.orderComment.findUniqueOrThrow({
    where: { id: commentId },
    include: { order: { select: { id: true, orderNumber: true } }, author: { select: { name: true } } },
  });
  return withOrder(comment.order.id, `comment:${comment.id}`, {
    vrsta: "komentar",
    porudzbina: { id: comment.order.id, broj: comment.order.orderNumber, url: `${baseUrl()}/portal/admin/orders/${comment.order.id}` },
    komentar: {
      id: comment.id,
      ko: comment.author?.name ?? "User",
      strana: comment.role === "team" ? "tim" : "klijent",
      tekst: comment.body,
    },
  });
}

/** Uploaded file → note on the deal; `strana` says who uploaded (client uploads are announced). */
export async function irisFile(fileId: string, strana: "tim" | "klijent") {
  const file = await prisma.orderFile.findUniqueOrThrow({
    where: { id: fileId },
    include: { order: { select: { id: true, orderNumber: true } } },
  });
  return withOrder(file.order.id, `file:${file.id}`, {
    vrsta: "fajl",
    porudzbina: { id: file.order.id, broj: file.order.orderNumber, url: `${baseUrl()}/portal/admin/orders/${file.order.id}` },
    fajl: {
      id: file.id,
      ime: file.fileName,
      velicina: file.fileSize,
      vrsta: file.kind,
      strana,
      url: `${baseUrl()}/api/portal/download?path=${encodeURIComponent(file.storagePath)}&orderId=${file.order.id}`,
    },
  });
}
