/**
 * DeliverablesCard — Panel listing final deliverable files with download links.
 * Shows an empty state when no files are ready yet.
 *
 * Used on: /portal/orders/[orderId] (order detail page).
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
      <div className="rounded-lg border border-border/40 bg-card/60 p-5">
        <h3 className="text-sm font-semibold text-foreground">
          Ready to download
        </h3>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          No final files are ready yet. They will appear here when available.
        </p>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-5">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Ready to download
        </h3>
      </div>

      <div className="mt-4 space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-xl bg-background/80 px-3 py-2.5"
          >
            <FileDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {file.fileName}
              </p>
              <p className="text-[0.72rem] text-muted-foreground">
                {formatSize(file.fileSize)} ·{" "}
                {file.uploadedAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <a
              href={`/api/portal/download?path=${encodeURIComponent(file.storagePath)}&orderId=${orderId}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-foreground transition-colors hover:bg-accent/20"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
