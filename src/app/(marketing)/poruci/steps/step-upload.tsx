"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCheckout } from "../checkout-context";
import { confirmFileUpload } from "@/server/actions/order";

const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB total

type UploadingFile = {
  file: File;
  progress: number;
  error?: string;
};

export function StepUpload() {
  const { orderId, uploadedFiles, addFile, removeFile, customerNote, setCustomerNote, setStep } = useCheckout();
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalUploaded = uploadedFiles.reduce((s, f) => s + f.fileSize, 0);
  const totalUploading = uploading.reduce((s, f) => s + f.file.size, 0);

  const uploadFile = useCallback(
    async (file: File) => {
      if (totalUploaded + totalUploading + file.size > MAX_TOTAL_BYTES) {
        setUploading((prev) => [
          ...prev,
          { file, progress: 0, error: "Ukupna veličina prelazi 100MB" },
        ]);
        return;
      }

      const entry: UploadingFile = { file, progress: 0 };
      setUploading((prev) => [...prev, entry]);

      try {
        // Get signed URL
        const urlRes = await fetch("/api/checkout/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderId ?? "draft",
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });

        if (!urlRes.ok) {
          const { error } = await urlRes.json();
          throw new Error(error || "Greška pri generisanju upload linka");
        }

        const { signedUrl, storagePath, token } = await urlRes.json();

        // Upload directly to Supabase Storage
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "x-upsert": "true",
          },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Upload nije uspeo");
        }

        // Confirm in DB if we have an orderId
        if (orderId) {
          await confirmFileUpload(orderId, file.name, file.size, file.type, storagePath);
        }

        addFile({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storagePath,
        });

        setUploading((prev) => prev.filter((u) => u.file !== file));
      } catch (err) {
        setUploading((prev) =>
          prev.map((u) =>
            u.file === file
              ? { ...u, error: err instanceof Error ? err.message : "Greška" }
              : u,
          ),
        );
      }
    },
    [orderId, totalUploaded, totalUploading, addFile],
  );

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(uploadFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          Materijali za projekat
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pošaljite osnove prostora, fotografije i reference stila. Podržani
          formati: JPG, PNG, WebP, TIFF, PDF.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border/60 bg-background/40 hover:border-accent/50"
          }`}
        >
          <Upload className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            Prevucite fajlove ovde
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ili kliknite da izaberete · max 100MB ukupno
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/tiff,application/pdf"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Upload progress */}
        <p className="mt-3 text-right text-xs text-muted-foreground">
          {formatSize(totalUploaded)} / 100 MB
        </p>

        {/* Uploading files */}
        {uploading.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploading.map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/60 px-4 py-2.5"
              >
                <FileUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{u.file.name}</p>
                  {u.error ? (
                    <p className="text-xs text-destructive">{u.error}</p>
                  ) : (
                    <p className="text-xs text-accent">Otpremanje…</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatSize(u.file.size)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((f) => (
              <div
                key={f.storagePath}
                className="flex items-center gap-3 rounded-lg border border-[color:var(--color-sage)]/20 bg-[color:var(--color-sage)]/5 px-4 py-2.5"
              >
                <FileUp className="h-4 w-4 flex-shrink-0 text-[color:var(--color-sage-deep)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{f.fileName}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatSize(f.fileSize)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(f.storagePath)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer note */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
        <Label htmlFor="note">Napomena (opciono)</Label>
        <Textarea
          id="note"
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          rows={3}
          placeholder="Rok, stil, posebni zahtevi…"
          className="mt-2"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(0)}>
          Nazad
        </Button>
        <Button variant="accent" size="lg" onClick={() => setStep(2)}>
          Nastavi na pregled
        </Button>
      </div>
    </div>
  );
}
