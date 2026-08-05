"use client";

import { useActionState, useState } from "react";
import {
  submitWithdrawalNotice,
  type WithdrawalFormState,
} from "./actions";

type Draft = {
  consumerName: string;
  consumerEmail: string;
  orderNumber: string;
  contractDate: string;
  serviceDescription: string;
  message: string;
  companyWebsite: string;
};

const INITIAL_STATE: WithdrawalFormState = { status: "idle" };

const inputClass =
  "mt-2 min-h-11 w-full rounded-[4px] border border-border bg-background px-3 py-2 text-base text-foreground outline-none transition focus:border-foreground/50 focus:ring-2 focus:ring-accent/25";

export function WithdrawalForm() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [state, formAction, pending] = useActionState(
    submitWithdrawalNotice,
    INITIAL_STATE,
  );

  if (state.status === "success") {
    const receivedAt = new Date(state.receivedAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    return (
      <div
        role="status"
        className="rounded-xl border border-accent/40 bg-accent/8 p-6 text-foreground"
      >
        <h3 className="text-xl">Withdrawal notice received</h3>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="font-semibold">Reference</dt>
          <dd className="font-mono">{state.reference}</dd>
          <dt className="font-semibold">Received</dt>
          <dd>{receivedAt}</dd>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-foreground/70">
          {state.confirmationSent
            ? "We sent a durable copy of the notice to the email address you provided. Keep it with your order records."
            : "The notice reached our team, but the confirmation email could not be delivered. Save this reference and contact info@elegantrender.com if you need another copy."}
        </p>
      </div>
    );
  }

  if (!draft) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setDraft({
            consumerName: String(data.get("consumerName") ?? "").trim(),
            consumerEmail: String(data.get("consumerEmail") ?? "").trim(),
            orderNumber: String(data.get("orderNumber") ?? "").trim(),
            contractDate: String(data.get("contractDate") ?? "").trim(),
            serviceDescription: String(data.get("serviceDescription") ?? "").trim(),
            message: String(data.get("message") ?? "").trim(),
            companyWebsite: String(data.get("companyWebsite") ?? "").trim(),
          });
        }}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Consumer name" htmlFor="withdrawal-name">
            <input
              id="withdrawal-name"
              name="consumerName"
              type="text"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              className={inputClass}
            />
          </Field>
          <Field label="Email for confirmation" htmlFor="withdrawal-email">
            <input
              id="withdrawal-email"
              name="consumerEmail"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              className={inputClass}
            />
          </Field>
          <Field label="Order number or contract reference" htmlFor="withdrawal-order">
            <input
              id="withdrawal-order"
              name="orderNumber"
              type="text"
              required
              minLength={3}
              maxLength={80}
              autoComplete="off"
              className={inputClass}
            />
          </Field>
          <Field label="Contract date (optional)" htmlFor="withdrawal-date">
            <input
              id="withdrawal-date"
              name="contractDate"
              type="date"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Service (optional)" htmlFor="withdrawal-service">
          <input
            id="withdrawal-service"
            name="serviceDescription"
            type="text"
            maxLength={200}
            placeholder="For example, interior render or AI Studio credits"
            className={inputClass}
          />
        </Field>

        <Field label="Additional information (optional)" htmlFor="withdrawal-message">
          <textarea
            id="withdrawal-message"
            name="message"
            rows={4}
            maxLength={1200}
            placeholder="Add information that helps us identify the contract. You do not need to give a reason."
            className={inputClass}
          />
        </Field>

        <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="withdrawal-company-website">Company website</label>
          <input
            id="withdrawal-company-website"
            name="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-[4px] bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/80"
        >
          Review withdrawal
        </button>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {Object.entries(draft).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="affirmation" value="withdraw" />

      <div className="rounded-lg border border-border/60 bg-background/70 p-5">
        <p className="font-medium text-foreground">
          I withdraw from the contract identified below.
        </p>
        <dl className="mt-4 grid gap-3 text-sm leading-relaxed sm:grid-cols-[180px_1fr]">
          <ReviewRow label="Consumer" value={draft.consumerName} />
          <ReviewRow label="Confirmation email" value={draft.consumerEmail} />
          <ReviewRow label="Order or contract" value={draft.orderNumber} />
          {draft.contractDate && <ReviewRow label="Contract date" value={draft.contractDate} />}
          {draft.serviceDescription && <ReviewRow label="Service" value={draft.serviceDescription} />}
          {draft.message && <ReviewRow label="Additional information" value={draft.message} />}
        </dl>
      </div>

      {state.status === "error" && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <p className="text-sm leading-relaxed text-foreground/65">
        Select Confirm withdrawal to send this unambiguous statement. The
        server records the receipt time and sends a copy to the email above.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-[4px] bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/80 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Sending…" : "Confirm withdrawal"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setDraft(null)}
          className="inline-flex min-h-11 items-center justify-center rounded-[4px] border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-60"
        >
          Edit details
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-semibold text-foreground/75">{label}</dt>
      <dd className="whitespace-pre-wrap text-foreground/70">{value}</dd>
    </>
  );
}
