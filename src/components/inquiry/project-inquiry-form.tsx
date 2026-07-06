"use client";

import { useRef, useState } from "react";
import { Check, FileUp, Paperclip, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PROJECT_INQUIRY_MAX_FILE_BYTES,
  PROJECT_INQUIRY_MAX_TOTAL_BYTES,
  PROJECT_INQUIRY_SERVICE_TYPES,
  formatInquiryFileSize,
  isAllowedProjectInquiryMimeType,
  type ProjectInquiryFileInput,
} from "@/lib/project-inquiry";
import { submitProjectInquiry } from "@/server/actions/project-inquiry";
import { track } from "@/lib/posthog-events";
import { pushGoogleDataLayerEvent } from "@/lib/analytics/google-data-layer-client";

export type InquiryFormSource = {
  source?: string;
  sourcePath?: string;
  sourceLabel?: string;
  serviceType?: string;
  quoteSnapshot?: unknown;
};

type Props = {
  mode: "quick" | "contact";
  source?: InquiryFormSource;
  initialContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSubmitted?: () => void;
};

type UploadingFile = {
  file: File;
  error?: string;
};

function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ProjectInquiryForm({
  mode,
  source,
  initialContact,
  onSubmitted,
}: Props) {
  const [draftId, setDraftId] = useState(createDraftId);
  const [contactName, setContactName] = useState(initialContact?.name ?? "");
  const [email, setEmail] = useState(initialContact?.email ?? "");
  const [phone, setPhone] = useState(initialContact?.phone ?? "");
  const [company, setCompany] = useState("");
  const [serviceType, setServiceType] = useState(source?.serviceType ?? "");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<ProjectInquiryFileInput[]>([]);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<
    | { kind: "idle" }
    | { kind: "success"; inquiryId: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contactFormStartedRef = useRef(false);

  const totalUploaded = files.reduce((sum, file) => sum + file.fileSize, 0);
  const totalUploading = uploading.reduce(
    (sum, file) => sum + (file.error ? 0 : file.file.size),
    0,
  );
  const resolvedSource =
    source?.source ?? (mode === "contact" ? "contact-page" : "quick-inquiry");

  const trackContactFormStarted = () => {
    if (mode !== "contact" || contactFormStartedRef.current) return;
    contactFormStartedRef.current = true;
    track("contact_form_started", {
      source: resolvedSource,
      ...(source?.sourcePath ? { source_path: source.sourcePath } : {}),
    });
  };

  const resetForAnother = () => {
    setDraftId(createDraftId());
    setMessage("");
    setBudget("");
    setDeadline("");
    setFiles([]);
    setUploading([]);
    setResult({ kind: "idle" });
  };

  const uploadFile = async (file: File) => {
    const entry: UploadingFile = { file };
    setUploading((prev) => [...prev, entry]);

    try {
      const urlRes = await fetch("/api/inquiries/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!urlRes.ok) {
        const body = (await urlRes.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not generate an upload link");
      }

      const { signedUrl, storagePath } = (await urlRes.json()) as {
        signedUrl: string;
        storagePath: string;
      };

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      setFiles((prev) => [
        ...prev,
        {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storagePath,
        },
      ]);
      setUploading((prev) => prev.filter((item) => item.file !== file));
    } catch (err) {
      setUploading((prev) =>
        prev.map((item) =>
          item.file === file
            ? {
                ...item,
                error: err instanceof Error ? err.message : "Something went wrong",
              }
            : item,
        ),
      );
    }
  };

  const handleFiles = (incoming: FileList | File[]) => {
    setResult({ kind: "idle" });
    let nextTotal = totalUploaded + totalUploading;

    Array.from(incoming).forEach((file) => {
      if (file.size > PROJECT_INQUIRY_MAX_FILE_BYTES) {
        setUploading((prev) => [
          ...prev,
          { file, error: "File is larger than 50MB" },
        ]);
        return;
      }
      if (!isAllowedProjectInquiryMimeType(file.type)) {
        setUploading((prev) => [
          ...prev,
          { file, error: "Allowed formats are JPG, PNG, WebP, TIFF and PDF" },
        ]);
        return;
      }
      if (nextTotal + file.size > PROJECT_INQUIRY_MAX_TOTAL_BYTES) {
        setUploading((prev) => [
          ...prev,
          { file, error: "Total size exceeds 100MB" },
        ]);
        return;
      }
      nextTotal += file.size;
      void uploadFile(file);
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (uploading.some((file) => !file.error)) {
      setResult({ kind: "error", message: "Please wait for the upload to finish." });
      return;
    }

    setPending(true);
    setResult({ kind: "idle" });

    const res = await submitProjectInquiry({
      draftId,
      contactName,
      email,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      serviceType: serviceType.trim() || undefined,
      budget: budget.trim() || undefined,
      deadline: deadline.trim() || undefined,
      message,
      source: resolvedSource,
      sourcePath: source?.sourcePath,
      sourceLabel: source?.sourceLabel,
      quoteSnapshot: source?.quoteSnapshot,
      files,
    });

    setPending(false);
    if ("error" in res) {
      setResult({ kind: "error", message: res.error });
      return;
    }

    track("project_inquiry_submitted", {
      source: resolvedSource,
      file_count: files.length,
      has_quote_snapshot: Boolean(source?.quoteSnapshot),
    });
    pushGoogleDataLayerEvent({
      event: "generate_lead",
      value: 0,
      currency: "EUR",
      event_id: `lead:${res.inquiryId}`,
      lead_type: mode === "quick" ? "quick_inquiry" : "project_inquiry",
      source_path: source?.sourcePath ?? window.location.pathname,
      conversion_source: resolvedSource,
      file_count: files.length,
      has_quote_snapshot: Boolean(source?.quoteSnapshot),
    });
    setResult({ kind: "success", inquiryId: res.inquiryId });
    onSubmitted?.();
  };

  if (result.kind === "success") {
    return (
      <div className="rounded-2xl border border-border bg-secondary p-7 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Inquiry received
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you. We will review the brief and materials, then get back to
          you with a service proposal and an estimate.
        </p>
        {mode === "contact" && (
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={resetForAnother}
          >
            Send another inquiry
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} onFocusCapture={trackContactFormStarted} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-inquiry-name`}>
            <Pencil className="h-3 w-3 text-accent/60" />
            Full name
          </Label>
          <Input
            id={`${mode}-inquiry-name`}
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            required
            autoComplete="name"
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-inquiry-email`}>
            <Pencil className="h-3 w-3 text-accent/60" />
            Email
          </Label>
          <Input
            id={`${mode}-inquiry-email`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            maxLength={200}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-inquiry-phone`}>
            <Pencil className="h-3 w-3 text-accent/60" />
            Phone (optional)
          </Label>
          <Input
            id={`${mode}-inquiry-phone`}
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            maxLength={40}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-inquiry-service`}>Project type</Label>
          <select
            id={`${mode}-inquiry-service`}
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Select if you already know</option>
            {PROJECT_INQUIRY_SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === "contact" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="contact-inquiry-company">
              <Pencil className="h-3 w-3 text-accent/60" />
              Company (optional)
            </Label>
            <Input
              id="contact-inquiry-company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              maxLength={120}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-inquiry-budget">Approximate budget</Label>
              <Input
                id="contact-inquiry-budget"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="e.g. an approximate budget or a range..."
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-inquiry-deadline">Deadline</Label>
              <Input
                id="contact-inquiry-deadline"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                placeholder="e.g. this week, by the end of the month..."
                maxLength={80}
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${mode}-inquiry-message`}>
          <Pencil className="h-3 w-3 text-accent/60" />
          Project description
        </Label>
        <Textarea
          id={`${mode}-inquiry-message`}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={mode === "contact" ? 7 : 4}
          placeholder="Type of space, what you want to achieve, how many views/rooms you have, your deadline and links to references..."
          required
          maxLength={4000}
        />
      </div>

      <div className="space-y-3">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            handleFiles(event.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border/60 bg-secondary/25 hover:border-accent/50"
          }`}
        >
          <Upload className="mb-3 h-7 w-7 text-muted-foreground/55" />
          <p className="text-sm font-medium text-foreground">
            Attach floor plans, photos or references
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WebP, TIFF, PDF · max 100MB total
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/tiff,application/pdf"
            onChange={(event) => {
              if (event.target.files) handleFiles(event.target.files);
              event.currentTarget.value = "";
            }}
            className="hidden"
          />
        </div>

        <p className="text-right text-xs text-muted-foreground">
          {formatInquiryFileSize(totalUploaded)} / 100 MB
        </p>

        {(uploading.length > 0 || files.length > 0) && (
          <div className="space-y-2">
            {uploading.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/70 px-3 py-2"
              >
                <FileUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {item.file.name}
                  </p>
                  <p
                    className={`text-xs ${
                      item.error ? "text-destructive" : "text-accent"
                    }`}
                  >
                    {item.error ?? "Uploading..."}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatInquiryFileSize(item.file.size)}
                </span>
              </div>
            ))}
            {files.map((file) => (
              <div
                key={file.storagePath}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2"
              >
                <Paperclip className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {file.fileName}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatInquiryFileSize(file.fileSize)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) =>
                      prev.filter((item) => item.storagePath !== file.storagePath),
                    )
                  }
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Remove file from inquiry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {result.kind === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-4 py-3 text-sm text-destructive">
          {result.message}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border/40 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted-foreground">
          By submitting this form you agree that we process your details to
          prepare a response.
        </p>
        <Button type="submit" size="lg" variant="accent" disabled={pending}>
          {pending ? "Sending..." : "Send an inquiry"}
        </Button>
      </div>
    </form>
  );
}
