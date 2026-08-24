"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Upload } from "lucide-react";
import { adminUploadDeliverable } from "@/server/actions/admin";

export function AdminDeliverableUpload({ orderId }: { orderId: string }) {
  const [uploading, setUploading] = useState<{ name: string; error?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading((prev) => [...prev, { name: file.name }]);

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
          throw new Error(error || "Erreur");
        }

        const { signedUrl, storagePath } = await urlRes.json();

        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type, "x-upsert": "true" },
          body: file,
        });

        if (!uploadRes.ok) throw new Error("Échec de l’import");

        await adminUploadDeliverable(orderId, file.name, file.size, file.type, storagePath);
        setUploading((prev) => prev.filter((u) => u.name !== file.name));
        router.refresh();
      } catch (err) {
        setUploading((prev) =>
          prev.map((u) =>
            u.name === file.name
              ? { ...u, error: err instanceof Error ? err.message : "Erreur" }
              : u,
          ),
        );
      }
    },
    [orderId, router],
  );

  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Importer un livrable
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Les fichiers seront visibles par le client dans la section « Fichiers livrés ».
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-accent/30 px-4 py-4 transition-colors hover:border-accent/50 hover:bg-accent/5"
      >
        <Upload className="mr-2 h-4 w-4 text-accent" />
        <span className="text-xs font-medium text-accent">Choisir des fichiers</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && Array.from(e.target.files).forEach(uploadFile)}
          className="hidden"
        />
      </div>

      {uploading.length > 0 && (
        <div className="mt-3 space-y-1">
          {uploading.map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <FileUp className="h-3 w-3 text-muted-foreground" />
              <span className="flex-1 truncate text-foreground">{u.name}</span>
              {u.error ? (
                <span className="text-destructive">{u.error}</span>
              ) : (
                <span className="text-accent">Import en cours…</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
