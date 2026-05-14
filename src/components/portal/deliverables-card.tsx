/**
 * DeliverablesCard — Panel listing final deliverable files with download links.
 * Shows an empty state when no files are ready yet.
 *
 * Used on: /portal/porudzbine/[orderId] (order detail page).
 */
import { Download, FileDown } from "lucide-react";

type DeliverableFile = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedAt: Date;
};

type DeliverablesCardProps = {
  files: DeliverableFile[];
  orderId: string;
};

export function DeliverablesCard({ files, orderId }: DeliverablesCardProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
        <h3 className="text-sm font-semibold text-foreground">
          Spremno za preuzimanje
        </h3>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Još nema gotovih fajlova. Pojaviće se ovde kada budu spremni.
        </p>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-2xl border border-[color:var(--color-sage)]/20 bg-[color:var(--color-sage)]/5 p-5">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-[color:var(--color-sage-deep)]" />
        <h3 className="text-sm font-semibold text-foreground">
          Spremno za preuzimanje
        </h3>
      </div>

      <div className="mt-4 space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-xl bg-background/80 px-3 py-2.5"
          >
            <FileDown className="h-4 w-4 flex-shrink-0 text-[color:var(--color-sage-deep)]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {file.fileName}
              </p>
              <p className="text-[0.72rem] text-muted-foreground">
                {formatSize(file.fileSize)} ·{" "}
                {file.uploadedAt.toLocaleDateString("sr-Latn-RS", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <a
              href={`/api/portal/download?path=${encodeURIComponent(file.storagePath)}&orderId=${orderId}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)] transition-colors hover:bg-[color:var(--color-sage)]/20"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
