/**
 * ItemConfigPanel — Expandable per-item configuration with simple/advanced modes.
 * Simple: description + file upload. Advanced: detailed config, references, technical docs.
 *
 * Used on: /portal/porudzbine/[orderId] (order detail, draft orders).
 */
"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  FileUp,
  Settings2,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatEur } from "@/lib/catalog/calculate";
import { updateItemConfig, confirmItemFileUpload } from "@/server/actions/item-config";

type ItemFile = {
  id: string;
  fileName: string;
  fileSize: number;
  kind: string;
};

type ItemData = {
  id: string;
  orderId: string;
  productLabel: string;
  categoryLabel: string;
  totalEur: number;
  clientNote: string | null;
  configJson: Record<string, unknown> | null;
  files: ItemFile[];
};

export function ItemConfigPanel({ item }: { item: ItemData }) {
  const [expanded, setExpanded] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [note, setNote] = useState(item.clientNote ?? "");
  const [styleDesc, setStyleDesc] = useState(
    (item.configJson?.styleDescription as string) ?? "",
  );
  const [roomDetails, setRoomDetails] = useState(
    (item.configJson?.roomDetails as string) ?? "",
  );
  const [techNotes, setTechNotes] = useState(
    (item.configJson?.technicalNotes as string) ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    await updateItemConfig(item.id, {
      clientNote: note || undefined,
      configJson: advanced
        ? { styleDescription: styleDesc, roomDetails, technicalNotes: techNotes }
        : undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const uploadFile = useCallback(
    async (file: File, kind: string) => {
      setUploading((prev) => [...prev, file.name]);
      try {
        const urlRes = await fetch("/api/checkout/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: item.orderId,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });
        if (!urlRes.ok) throw new Error("Greška");
        const { signedUrl, storagePath } = await urlRes.json();
        await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type, "x-upsert": "true" },
          body: file,
        });
        await confirmItemFileUpload(
          item.orderId,
          item.id,
          file.name,
          file.size,
          file.type,
          storagePath,
          kind,
        );
        router.refresh();
      } catch {}
      setUploading((prev) => prev.filter((n) => n !== file.name));
    },
    [item.orderId, item.id, router],
  );

  const formatSize = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const hasConfig = !!(item.clientNote || (item.configJson && Object.keys(item.configJson).length > 0) || item.files.length > 0);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 transition-shadow hover:shadow-[0_4px_16px_rgba(28,26,25,0.03)]">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {item.productLabel}
            </h3>
            {hasConfig && (
              <span className="rounded bg-[color:var(--color-sage)]/15 px-1.5 py-0.5 text-[0.55rem] font-semibold text-[color:var(--color-sage-deep)]">
                Podešeno
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.categoryLabel} · {formatEur(item.totalEur)}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/30 p-5 space-y-5">
          {/* Simple mode: description */}
          <div className="space-y-2">
            <Label htmlFor={`note-${item.id}`} className="text-xs">
              Opis projekta za ovu stavku
            </Label>
            <Textarea
              id={`note-${item.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opišite šta želite — stil, atmosferu, posebne zahteve…"
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Simple mode: file upload */}
          <div className="space-y-2">
            <Label className="text-xs">Osnove i fotografije</Label>
            <div
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border/40 px-4 py-4 transition-colors hover:border-accent/40"
            >
              <Upload className="mr-2 h-4 w-4 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">
                Prevucite ili kliknite — osnove, foto, skice
              </span>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) =>
                  e.target.files &&
                  Array.from(e.target.files).forEach((f) => uploadFile(f, "source"))
                }
                className="hidden"
              />
            </div>
          </div>

          {/* Uploaded files for this item */}
          {(item.files.length > 0 || uploading.length > 0) && (
            <div className="space-y-1.5">
              {item.files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-xs"
                >
                  <FileUp className="h-3 w-3 text-muted-foreground" />
                  <span className="flex-1 truncate text-foreground">{f.fileName}</span>
                  <span className="text-muted-foreground">{formatSize(f.fileSize)}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[0.55rem] text-muted-foreground">
                    {f.kind}
                  </span>
                </div>
              ))}
              {uploading.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 rounded-lg bg-accent/5 px-3 py-2 text-xs"
                >
                  <FileUp className="h-3 w-3 text-accent" />
                  <span className="flex-1 truncate text-foreground">{name}</span>
                  <span className="text-accent">Otpremanje…</span>
                </div>
              ))}
            </div>
          )}

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium text-accent transition-colors hover:text-accent/80"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {advanced ? "Sakrij napredno podešavanje" : "Napredno podešavanje"}
          </button>

          {/* Advanced mode */}
          {advanced && (
            <div className="space-y-4 rounded-xl border border-border/30 bg-secondary/20 p-4">
              <div className="space-y-2">
                <Label htmlFor={`style-${item.id}`} className="text-xs">
                  Reference stila i atmosfera
                </Label>
                <Textarea
                  id={`style-${item.id}`}
                  value={styleDesc}
                  onChange={(e) => setStyleDesc(e.target.value)}
                  placeholder="Opišite željeni stil — moderna, skandinavska, minimalistička, topla…"
                  rows={2}
                  className="resize-none text-sm"
                />
                <div
                  onClick={() => refInputRef.current?.click()}
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/40 px-3 py-3 transition-colors hover:border-accent/40"
                >
                  <Upload className="mr-2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="text-[0.65rem] text-muted-foreground">
                    Upload slika inspiracije (mood board)
                  </span>
                  <input
                    ref={refInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files &&
                      Array.from(e.target.files).forEach((f) =>
                        uploadFile(f, "reference"),
                      )
                    }
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rooms-${item.id}`} className="text-xs">
                  Detalji po prostoriji
                </Label>
                <Textarea
                  id={`rooms-${item.id}`}
                  value={roomDetails}
                  onChange={(e) => setRoomDetails(e.target.value)}
                  placeholder="Dnevna soba: svetli tonovi, drveni pod&#10;Spavaća: tamni zidovi, tople boje&#10;Kuhinja: moderna, beli elementi"
                  rows={4}
                  className="resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tech-${item.id}`} className="text-xs">
                  Tehničke napomene
                </Label>
                <Textarea
                  id={`tech-${item.id}`}
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                  placeholder="Format isporuke, rezolucija, posebni zahtevi…"
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center justify-between">
            <p className="text-[0.6rem] text-muted-foreground">
              Fajlovi se čuvaju automatski. Kliknite sačuvaj za opis i podešavanja.
            </p>
            <Button
              variant="accent"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saved ? (
                <>
                  <Check className="mr-1 h-3 w-3" /> Sačuvano
                </>
              ) : saving ? (
                "Čuvanje…"
              ) : (
                "Sačuvaj"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
