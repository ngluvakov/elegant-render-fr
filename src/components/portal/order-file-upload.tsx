"use client";

/**
 * OrderFileUpload — self-contained source-file dropzone for an order.
 *
 * Extracted from the pre-restructure checkout upload step: uploads go
 * straight to Supabase Storage via a presigned URL, then
 * confirmFileUpload records the row (with a synchronous AV scan).
 * The backend endpoints are order-scoped and payment-agnostic, so this
 * mounts anywhere an order exists.
 *
 * Used on: checkout SuccessScreen (post-payment upload) and
 * portal/orders/[orderId] when a paid service order has no source files.
 */

import { useCallback, useRef, useState } from "react";
import { FileUp, Trash2, Upload } from "lucide-react";
import { confirmFileUpload } from "@/server/actions/order";
import { putFileWithProgress } from "@/lib/upload-progress";

const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB total

type UploadedFile = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
};

type UploadingFile = {
  file: File;
  progress: number;
  error?: string;
};

export function OrderFileUpload({
  orderId,
  title = "Project files",
  description = "Upload floor plans, photos and style references. Supported formats: JPG, PNG, WebP, TIFF, PDF.",
}: {
  orderId: string;
  title?: string;
  description?: string;
}) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
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
          { file, progress: 0, error: "Total size exceeds 100MB" },
        ]);
        return;
      }

      const entry: UploadingFile = { file, progress: 0 };
      setUploading((prev) => [...prev, entry]);

      try {
        const urlRes = await fetch("/api/checkout/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });

        if (!urlRes.ok) {
          const { error } = await urlRes.json();
          throw new Error(error || "Could not create an upload link");
        }

        const { signedUrl, storagePath } = await urlRes.json();

        await putFileWithProgress(signedUrl, file, (pct) => {
          setUploading((prev) =>
            prev.map((u) => (u.file === file ? { ...u, progress: pct } : u)),
          );
        });

        // Server-side AV scan runs inside confirmFileUpload — a flagged
        // file is rejected and cleaned up from storage by the server.
        const result = await confirmFileUpload(
          orderId,
          file.name,
          file.size,
          file.type,
          storagePath,
        );
        if (result?.error) {
          throw new Error(result.error);
        }

        setUploadedFiles((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            storagePath,
          },
        ]);
        setUploading((prev) => prev.filter((u) => u.file !== file));
      } catch (err) {
        setUploading((prev) =>
          prev.map((u) =>
            u.file === file
              ? { ...u, error: err instanceof Error ? err.message : "Upload failed" }
              : u,
          ),
        );
      }
    },
    [orderId, totalUploaded, totalUploading],
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
    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 text-left">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

      {/* Drop zone — role/tabIndex/onKeyDown keep it keyboard-accessible
          (the input itself is visually hidden). */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files — drag them here or press Enter to browse"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border/60 bg-background/40 hover:border-accent/50"
        }`}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">
          Drag files here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or click to browse · 100MB total max
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

      <p className="mt-3 text-right text-xs text-muted-foreground">
        {formatSize(totalUploaded)} / 100 MB
      </p>

      {/* In-flight uploads */}
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
                  <div className="mt-1 flex items-center gap-2">
                    <div
                      role="progressbar"
                      aria-valuenow={u.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uploading: ${u.file.name}`}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-200"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                    <span className="min-w-14 text-right text-xs tabular-nums text-accent">
                      {u.progress < 100 ? `${u.progress}%` : "Scanning…"}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatSize(u.file.size)}
              </span>
              {u.error && (
                <button
                  type="button"
                  aria-label={`Remove ${u.file.name}`}
                  onClick={() =>
                    setUploading((prev) => prev.filter((x) => x.file !== u.file))
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
