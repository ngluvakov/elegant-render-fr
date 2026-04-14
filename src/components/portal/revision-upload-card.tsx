"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Trash2, Upload } from "lucide-react";
import { confirmFileUpload } from "@/server/actions/order";

type UploadingFile = { file: File; error?: string };

export function RevisionUploadCard({ orderId }: { orderId: string }) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading((prev) => [...prev, { file }]);

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
          throw new Error(error || "Greška");
        }

        const { signedUrl, storagePath } = await urlRes.json();

        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type, "x-upsert": "true" },
          body: file,
        });

        if (!uploadRes.ok) throw new Error("Upload nije uspeo");

        await confirmFileUpload(orderId, file.name, file.size, file.type, storagePath);
        setUploading((prev) => prev.filter((u) => u.file !== file));
        router.refresh();
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
    [orderId, router],
  );

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(uploadFile);
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Pošaljite izmene / dodatne materijale
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Dodajte fotografije, reference ili korigovane osnove za ovaj projekat.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-border/40 hover:border-accent/40"
        }`}
      >
        <Upload className="mb-2 h-5 w-5 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          Prevucite ili kliknite
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
                <span className="text-[0.6rem] text-destructive">{u.error}</span>
              ) : (
                <span className="text-[0.6rem] text-accent">Otpremanje…</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
