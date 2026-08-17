/**
 * JobApplicationForm — the /jobs application form.
 *
 * Mirrors ProjectInquiryForm's contracts: client-side uploads through
 * signed Supabase URLs (via /api/jobs/upload-url), a hidden honeypot
 * field, optional Cloudflare Turnstile, and a submit through the
 * submitJobApplication server action.
 */
"use client";

import { useRef, useState } from "react";
import { Check, FileUp, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { cn } from "@/lib/utils";
import {
  JOB_3D_SKILLS,
  JOB_APPLICATION_MAX_FILE_BYTES,
  JOB_APPLICATION_MAX_PORTFOLIO_FILES,
  JOB_APPLICATION_MAX_TOTAL_BYTES,
  JOB_EMPLOYMENT_TYPES,
  JOB_EXPERIENCE_LEVELS,
  JOB_POSITIONS,
  JOB_SOFTWARE,
  formatJobFileSize,
  isAllowedJobApplicationMimeType,
  type JobApplicationFileInput,
  type JobApplicationFileKind,
} from "@/lib/job-application";
import { submitJobApplication } from "@/server/actions/job-application";

type UploadingFile = {
  kind: JobApplicationFileKind;
  file: File;
  error?: string;
};

function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

function ChecklistGrid({
  options,
  selected,
  onToggle,
  idPrefix,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (label: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((label) => {
        const checked = selected.includes(label);
        return (
          <label
            key={label}
            htmlFor={`${idPrefix}-${label}`}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-[4px] border px-3 py-2 text-sm transition-colors duration-200",
              checked
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-background text-foreground/80 hover:bg-secondary",
            )}
          >
            <input
              id={`${idPrefix}-${label}`}
              type="checkbox"
              className="h-4 w-4 shrink-0 accent-accent"
              checked={checked}
              onChange={() => onToggle(label)}
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}

export function JobApplicationForm() {
  const [draftId] = useState(createDraftId);

  // 01 — personal details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // 02 — position
  const [position, setPosition] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");

  // 03 — experience
  const [experienceYears, setExperienceYears] = useState("");
  const [education, setEducation] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  // 04 — files
  const [files, setFiles] = useState<JobApplicationFileInput[]>([]);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // 05/06 — checklists
  const [software, setSoftware] = useState<string[]>([]);
  const [softwareOther, setSoftwareOther] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsOther, setSkillsOther] = useState("");

  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<
    | { kind: "idle" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [pending, setPending] = useState(false);
  // Honeypot: bound to a hidden field no human fills. Any value → bot.
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const cvFile = files.find((file) => file.kind === "cv");
  const portfolioFiles = files.filter((file) => file.kind === "portfolio");
  const totalUploaded = files.reduce((sum, file) => sum + file.fileSize, 0);
  const totalUploading = uploading.reduce(
    (sum, item) => sum + (item.error ? 0 : item.file.size),
    0,
  );

  const toggle =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (label: string) =>
      setter((prev) =>
        prev.includes(label)
          ? prev.filter((item) => item !== label)
          : [...prev, label],
      );

  const uploadFile = async (file: File, kind: JobApplicationFileKind) => {
    const entry: UploadingFile = { kind, file };
    setUploading((prev) => [...prev, entry]);

    try {
      const urlRes = await fetch("/api/jobs/upload-url", {
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
        headers: { "Content-Type": file.type, "x-upsert": "true" },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      setFiles((prev) => [
        // A new CV replaces the previous one; portfolio files accumulate.
        ...(kind === "cv" ? prev.filter((f) => f.kind !== "cv") : prev),
        {
          kind,
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
                error:
                  err instanceof Error ? err.message : "Something went wrong",
              }
            : item,
        ),
      );
    }
  };

  const handlePicked = (
    incoming: FileList | null,
    kind: JobApplicationFileKind,
  ) => {
    if (!incoming?.length) return;
    setResult({ kind: "idle" });
    let nextTotal = totalUploaded + totalUploading;

    Array.from(incoming).forEach((file, index) => {
      if (
        kind === "portfolio" &&
        portfolioFiles.length + index >= JOB_APPLICATION_MAX_PORTFOLIO_FILES
      ) {
        setUploading((prev) => [
          ...prev,
          { kind, file, error: "Up to 3 portfolio files" },
        ]);
        return;
      }
      if (file.size > JOB_APPLICATION_MAX_FILE_BYTES) {
        setUploading((prev) => [
          ...prev,
          { kind, file, error: "File is larger than 50MB" },
        ]);
        return;
      }
      if (!isAllowedJobApplicationMimeType(file.type)) {
        setUploading((prev) => [
          ...prev,
          { kind, file, error: "Allowed formats: PDF, DOC, DOCX, ZIP, JPG, PNG, WebP" },
        ]);
        return;
      }
      if (nextTotal + file.size > JOB_APPLICATION_MAX_TOTAL_BYTES) {
        setUploading((prev) => [
          ...prev,
          { kind, file, error: "Total size exceeds 100MB" },
        ]);
        return;
      }
      nextTotal += file.size;
      void uploadFile(file, kind);
    });
  };

  const removeFile = (storagePath: string) =>
    setFiles((prev) => prev.filter((file) => file.storagePath !== storagePath));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (uploading.some((item) => !item.error)) {
      setResult({
        kind: "error",
        message: "Please wait for the upload to finish.",
      });
      return;
    }
    if (!cvFile) {
      setResult({ kind: "error", message: "Please attach your CV." });
      return;
    }
    if (!consent) {
      setResult({
        kind: "error",
        message:
          "Please confirm you agree to the processing of your application.",
      });
      return;
    }

    setPending(true);
    setResult({ kind: "idle" });

    const res = await submitJobApplication({
      draftId,
      fullName,
      email,
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || undefined,
      position,
      employmentType: employmentType.trim() || undefined,
      availableFrom: availableFrom.trim() || undefined,
      expectedSalary: expectedSalary.trim() || undefined,
      experienceYears: experienceYears.trim() || undefined,
      education: education.trim() || undefined,
      coverLetter,
      software,
      softwareOther: softwareOther.trim() || undefined,
      skills,
      skillsOther: skillsOther.trim() || undefined,
      files,
      companyWebsite,
      turnstileToken: turnstileToken ?? undefined,
    });

    setPending(false);
    if ("error" in res) {
      setResult({ kind: "error", message: res.error });
      return;
    }
    setResult({ kind: "success" });
  };

  if (result.kind === "success") {
    return (
      <div className="rounded-2xl border border-border bg-secondary p-7 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Application received
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you for applying. We review every application — if your
          profile matches what we are looking for, we will get in touch to
          schedule a conversation. A confirmation is on its way to your
          inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-10">
      {/* Honeypot — hidden from humans (off-screen, out of tab order, no
          autofill). A filled value means a bot; the server rejects it
          silently. Do not remove or make visible. */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={companyWebsite}
        onChange={(event) => setCompanyWebsite(event.target.value)}
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          opacity: 0,
        }}
      />

      {/* 01 — Personal details */}
      <section className="space-y-4">
        <SectionKicker>01 — Personal details</SectionKicker>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-name">Full name *</Label>
            <Input
              id="job-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              autoComplete="name"
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-email">Email *</Label>
            <Input
              id="job-email"
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
            <Label htmlFor="job-phone">Phone (optional)</Label>
            <Input
              id="job-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              maxLength={40}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-location">City and country (optional)</Label>
            <Input
              id="job-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              autoComplete="address-level2"
              maxLength={120}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-linkedin">LinkedIn (optional)</Label>
            <Input
              id="job-linkedin"
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
              placeholder="linkedin.com/in/…"
              maxLength={300}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-portfolio-url">
              Portfolio link (optional)
            </Label>
            <Input
              id="job-portfolio-url"
              value={portfolioUrl}
              onChange={(event) => setPortfolioUrl(event.target.value)}
              placeholder="Behance, ArtStation, your website…"
              maxLength={300}
            />
          </div>
        </div>
      </section>

      {/* 02 — Position */}
      <section className="space-y-4">
        <SectionKicker>02 — Position</SectionKicker>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-position">Position you are applying for *</Label>
            <select
              id="job-position"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              required
              className={SELECT_CLASS}
            >
              <option value="">Select a position</option>
              {JOB_POSITIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-employment">Employment type</Label>
            <select
              id="job-employment"
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Select if you have a preference</option>
              {JOB_EMPLOYMENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-available">Earliest start date</Label>
            <Input
              id="job-available"
              value={availableFrom}
              onChange={(event) => setAvailableFrom(event.target.value)}
              placeholder="e.g. immediately, from 1 October…"
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-salary">Expected salary (optional)</Label>
            <Input
              id="job-salary"
              value={expectedSalary}
              onChange={(event) => setExpectedSalary(event.target.value)}
              placeholder="e.g. a monthly range in EUR"
              maxLength={80}
            />
          </div>
        </div>
      </section>

      {/* 03 — Experience */}
      <section className="space-y-4">
        <SectionKicker>03 — Experience</SectionKicker>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-experience">Years of 3D experience</Label>
            <select
              id="job-experience"
              value={experienceYears}
              onChange={(event) => setExperienceYears(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Select</option>
              {JOB_EXPERIENCE_LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-education">Education (optional)</Label>
            <Input
              id="job-education"
              value={education}
              onChange={(event) => setEducation(event.target.value)}
              placeholder="School / university, field of study…"
              maxLength={240}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-cover">
            Cover letter — why you, and why Elegant Render? *
          </Label>
          <Textarea
            id="job-cover"
            value={coverLetter}
            onChange={(event) => setCoverLetter(event.target.value)}
            required
            rows={6}
            maxLength={6000}
            placeholder="A few sentences about your background, the work you are most proud of, and what you want to work on."
          />
        </div>
      </section>

      {/* 04 — CV & portfolio */}
      <section className="space-y-4">
        <SectionKicker>04 — CV &amp; portfolio</SectionKicker>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>CV / resume * (PDF, DOC, DOCX)</Label>
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => {
                handlePicked(event.target.files, "cv");
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => cvInputRef.current?.click()}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {cvFile ? "Replace CV" : "Attach your CV"}
            </Button>
            {cvFile && (
              <div className="flex items-center justify-between gap-3 rounded-[4px] border border-border bg-secondary/50 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{cvFile.fileName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatJobFileSize(cvFile.fileSize)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Remove CV"
                  onClick={() => removeFile(cvFile.storagePath)}
                  className="text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>
              Portfolio files (optional, up to {JOB_APPLICATION_MAX_PORTFOLIO_FILES} — PDF,
              ZIP, images)
            </Label>
            <input
              ref={portfolioInputRef}
              type="file"
              multiple
              accept=".pdf,.zip,.jpg,.jpeg,.png,.webp,application/pdf,application/zip,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                handlePicked(event.target.files, "portfolio");
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => portfolioInputRef.current?.click()}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Attach portfolio files
            </Button>
            {portfolioFiles.map((file) => (
              <div
                key={file.storagePath}
                className="flex items-center justify-between gap-3 rounded-[4px] border border-border bg-secondary/50 px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.fileName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatJobFileSize(file.fileSize)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.fileName}`}
                  onClick={() => removeFile(file.storagePath)}
                  className="text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        {uploading.length > 0 && (
          <ul className="space-y-1.5">
            {uploading.map((item, index) => (
              <li
                key={`${item.file.name}-${index}`}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-[4px] border px-3 py-2 text-sm",
                  item.error
                    ? "border-destructive/40 bg-destructive/5 text-destructive"
                    : "border-border bg-secondary/50 text-muted-foreground",
                )}
              >
                <span className="truncate">{item.file.name}</span>
                <span className="shrink-0 text-xs">
                  {item.error ?? "Uploading…"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 05 — Software */}
      <section className="space-y-4">
        <SectionKicker>05 — Software you work in</SectionKicker>
        <p className="text-sm text-muted-foreground">
          Tick everything you can use in production — no penalty for a short
          list, we care about what you do well.
        </p>
        <ChecklistGrid
          idPrefix="job-software"
          options={JOB_SOFTWARE}
          selected={software}
          onToggle={toggle(setSoftware)}
        />
        <div className="space-y-2">
          <Label htmlFor="job-software-other">Other software (optional)</Label>
          <Input
            id="job-software-other"
            value={softwareOther}
            onChange={(event) => setSoftwareOther(event.target.value)}
            placeholder="Anything we missed"
            maxLength={240}
          />
        </div>
      </section>

      {/* 06 — 3D skills */}
      <section className="space-y-4">
        <SectionKicker>06 — What you can do in 3D</SectionKicker>
        <ChecklistGrid
          idPrefix="job-skill"
          options={JOB_3D_SKILLS}
          selected={skills}
          onToggle={toggle(setSkills)}
        />
        <div className="space-y-2">
          <Label htmlFor="job-skills-other">Other skills (optional)</Label>
          <Input
            id="job-skills-other"
            value={skillsOther}
            onChange={(event) => setSkillsOther(event.target.value)}
            placeholder="Anything we missed"
            maxLength={240}
          />
        </div>
      </section>

      {/* Consent + submit */}
      <section className="space-y-4">
        <label
          htmlFor="job-consent"
          className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground"
        >
          <input
            id="job-consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
          />
          <span>
            I agree that White Rook DOO processes the data and files in this
            application for recruitment purposes. *
          </span>
        </label>

        {turnstileEnabled && (
          <TurnstileWidget onVerify={setTurnstileToken} />
        )}

        {result.kind === "error" && (
          <p className="rounded-[4px] border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {result.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Sending…" : "Submit application"}
        </Button>
      </section>
    </form>
  );
}
