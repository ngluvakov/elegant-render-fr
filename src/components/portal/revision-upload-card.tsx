/**
 * RevisionUploadCard — Drag-and-drop file upload for client revision materials.
 * Uploads to Supabase via signed URL and confirms via server action.
 *
 * Used on: /portal/orders/[orderId] (order detail page).
 */
"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Upload } from "lucide-react";
import { confirmFileUpload } from "@/server/actions/order";
import { putFileWithProgress } from "@/lib/upload-progress";

type UploadingFile = { file: File; progress: number; error?: string };

export function RevisionUploadCard({ orderId }: { orderId: string }) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading((prev) => [...prev, { file, progress: 0 }]);

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
          throw new Error(error || "Error");
        }

        const { signedUrl, storagePath } = await urlRes.json();

        await putFileWithProgress(signedUrl, file, (pct) => {
          setUploading((prev) =>
            prev.map((u) => (u.file === file ? { ...u, progress: pct } : u)),
          );
        });

        const result = await confirmFileUpload(
          orderId,
          file.name,
          file.size,
          file.type,
          storagePath,
        );
        if (result?.error) throw new Error(result.error);
        setUploading((prev) => prev.filter((u) => u.file !== file));
        router.refresh();
      } catch (err) {
        setUploading((prev) =>
          prev.map((u) =>
            u.file === file
              ? { ...u, error: err instanceof Error ? err.message : "Error" }
              : u,
          ),
        );
      }
    },
    [orderId, router],
  );

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(uploadFile);
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Send revisions / additional materials
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Add photos, references, or corrected plans for this project.
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files - drag them here or press Enter to choose"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
          dragOver ? "border-accent bg-accent/5" : "border-border/40 hover:border-accent/40"
        }`}
      >
        <Upload className="mb-2 h-5 w-5 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          Drag or click
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {uploading.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploading.map((u, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2"
            >
              <FileUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 truncate text-xs text-foreground">
                {u.file.name}
              </span>
              {u.error ? (
                <span className="text-[0.72rem] text-destructive">{u.error}</span>
              ) : (
                <span className="flex items-center gap-2">
                  <span
                    role="progressbar"
                    aria-valuenow={u.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading: ${u.file.name}`}
                    className="block h-1 w-16 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className="block h-full rounded-full bg-accent transition-[width] duration-200"
                      style={{ width: `${u.progress}%` }}
                    />
                  </span>
                  <span className="min-w-10 text-right text-[0.72rem] tabular-nums text-accent">
                    {u.progress < 100 ? `${u.progress}%` : "Checking..."}
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
