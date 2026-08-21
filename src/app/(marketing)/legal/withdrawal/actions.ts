"use server";

import * as Sentry from "@sentry/nextjs";
import { recordAuditLog } from "@/lib/audit";
import {
  sendWithdrawalNoticeAdminEmail,
  sendWithdrawalNoticeCustomerEmail,
  type WithdrawalNoticeEmailArgs,
} from "@/lib/email";
import {
  checkRateLimit,
  getServerActionIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";

export type WithdrawalFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      reference: string;
      receivedAt: string;
      confirmationSent: boolean;
    };

function field(formData: FormData, name: string, maxLength: number): string {
  return String(formData.get(name) ?? "").trim().slice(0, maxLength);
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validContractDate(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function submitWithdrawalNotice(
  _previousState: WithdrawalFormState,
  formData: FormData,
): Promise<WithdrawalFormState> {
  const identifier = await getServerActionIdentifier();
  const limit = await checkRateLimit("projectInquiry", identifier);
  if (!limit.ok) {
    return {
      status: "error",
      message: rateLimitMessage(limit.retryAfterSeconds),
    };
  }

  // Hidden honeypot. Return a generic success-shaped result so automated
  // submitters do not learn which field triggered the rejection.
  if (field(formData, "companyWebsite", 200)) {
    const receivedAt = new Date();
    return {
      status: "success",
      reference: "REQUEST-RECEIVED",
      receivedAt: receivedAt.toISOString(),
      confirmationSent: false,
    };
  }

  if (field(formData, "affirmation", 20) !== "withdraw") {
    return {
      status: "error",
      message: "Relisez l’avis et utilisez le bouton « Confirmer la rétractation ».",
    };
  }

  const consumerName = field(formData, "consumerName", 120);
  const consumerEmail = field(formData, "consumerEmail", 200).toLowerCase();
  const orderNumber = field(formData, "orderNumber", 80);
  const contractDate = field(formData, "contractDate", 10);
  const serviceDescription = field(formData, "serviceDescription", 200);
  const message = field(formData, "message", 1200);

  if (consumerName.length < 2) {
    return { status: "error", message: "Saisissez le nom complet du consommateur." };
  }
  if (!validEmail(consumerEmail)) {
    return { status: "error", message: "Saisissez une adresse e-mail valide." };
  }
  if (orderNumber.length < 3) {
    return { status: "error", message: "Saisissez le numéro de commande ou la référence du contrat." };
  }
  if (!validContractDate(contractDate)) {
    return { status: "error", message: "Saisissez une date de contrat valide." };
  }

  const receivedAt = new Date();
  const reference = `ER-WD-${receivedAt.toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const emailArgs: WithdrawalNoticeEmailArgs = {
    reference,
    receivedAt,
    consumerName,
    consumerEmail,
    orderNumber,
    contractDate: contractDate || undefined,
    serviceDescription: serviceDescription || undefined,
    message: message || undefined,
  };

  try {
    await sendWithdrawalNoticeAdminEmail(emailArgs);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "consumer-rights", flow: "withdrawal-admin-email" },
      extra: { reference, orderNumber },
    });
    return {
      status: "error",
      message:
        "Nous n’avons pas pu enregistrer l’avis en ligne. Écrivez immédiatement à info@elegantrender.fr et conservez une copie de votre message envoyé.",
    };
  }

  await recordAuditLog({
    action: "consumer.withdrawal_notice_received",
    entityType: "WithdrawalNotice",
    entityId: reference,
    metadata: {
      reference,
      receivedAt: receivedAt.toISOString(),
      consumerName,
      consumerEmail,
      orderNumber,
      contractDate: contractDate || null,
      serviceDescription: serviceDescription || null,
    },
  });

  let confirmationSent = true;
  try {
    await sendWithdrawalNoticeCustomerEmail(emailArgs);
  } catch (error) {
    confirmationSent = false;
    Sentry.captureException(error, {
      tags: { area: "consumer-rights", flow: "withdrawal-customer-email" },
      extra: { reference, orderNumber },
    });
  }

  return {
    status: "success",
    reference,
    receivedAt: receivedAt.toISOString(),
    confirmationSent,
  };
}
