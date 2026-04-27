"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Brush,
  Check,
  CircleDashed,
  Coins,
  Download,
  Eraser,
  ImageIcon,
  Loader2,
  RectangleHorizontal,
  RotateCcw,
  RotateCw,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AI_EDIT_TYPES,
  AI_IMAGE_PROVIDERS,
  AI_STYLE_OPTIONS,
  DEFAULT_AI_PROVIDER,
  formatCreditsFromUnits,
  getAiEditType,
  type AiEditType,
  type AiImageProvider,
} from "@/lib/ai-studio/catalog";
import {
  GenerationDetailModal,
  type GenerationDetail,
} from "./generation-detail-modal";

type GenerationHistoryItem = {
  id: string;
  parentGenerationId: string | null;
  editType: AiEditType;
  provider: AiImageProvider;
  model: string;
  prompt: string;
  styleId: string | null;
  status: "queued" | "processing" | "completed" | "failed";
  unitsCharged: number;
  freeAttemptIndex: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  inputStoragePath: string;
  inputMimeType: string;
  resultStoragePath: string | null;
  resultMimeType: string | null;
  resultUrl: string | null;
  inputUrl: string | null;
  downloadUrl: string | null;
  inputDownloadUrl: string | null;
  filesExpired: boolean;
  rootFileName: string | null;
  inputFileName: string | null;
  resultFileName: string | null;
  selectedOption: string | null;
  colorHex: string | null;
  maskInverted: boolean;
  hasMask: boolean;
};

type AiStudioState =
  | { error: string }
  | {
      balanceUnits: number;
      balanceLabel: string;
      creditsExpireAt: string | null;
      generations: GenerationHistoryItem[];
    };

type UploadedInput = {
  url: string;
  storagePath: string;
  mimeType: string;
  fileName: string;
  generationId?: string | null;
};

type ToolMode = "simple" | "advanced";
type MaskTool = "brush" | "rect";

export function AiStudioWorkspace({
  initialState,
}: {
  initialState: AiStudioState;
}) {
  const [balanceUnits, setBalanceUnits] = useState(
    "balanceUnits" in initialState ? initialState.balanceUnits : 0,
  );
  const [history, setHistory] = useState<GenerationHistoryItem[]>(
    "generations" in initialState ? initialState.generations : [],
  );
  const [creditsExpireAt, setCreditsExpireAt] = useState(
    "creditsExpireAt" in initialState ? initialState.creditsExpireAt : null,
  );
  const [mode, setMode] = useState<ToolMode>("simple");
  const [editType, setEditType] = useState<AiEditType>("virtual_staging");
  const [provider, setProvider] = useState<AiImageProvider>(DEFAULT_AI_PROVIDER);
  const [selectedOption, setSelectedOption] = useState("");
  const [styleId, setStyleId] = useState("modern");
  const [colorHex, setColorHex] = useState("#f2eee8");
  const [prompt, setPrompt] = useState("");
  const initialCompleted = useMemo(
    () =>
      "generations" in initialState
        ? initialState.generations.find(
            (item) => item.status === "completed" && item.resultUrl,
          )
        : null,
    [initialState],
  );
  const initialInput = useMemo(
    () =>
      "generations" in initialState
        ? initialState.generations.find((item) => item.inputUrl)
        : null,
    [initialState],
  );
  const [baseInput, setBaseInput] = useState<UploadedInput | null>(
    initialInput?.inputUrl
      ? {
          url: initialInput.inputUrl,
          storagePath: initialInput.inputStoragePath,
          mimeType: initialInput.inputMimeType,
          fileName: initialInput.inputFileName ?? "slika-za-obradu",
        }
      : null,
  );
  const [currentResult, setCurrentResult] = useState<UploadedInput | null>(
    initialCompleted?.resultUrl && initialCompleted.resultStoragePath
      ? {
          url: initialCompleted.resultUrl,
          storagePath: initialCompleted.resultStoragePath,
          mimeType: initialCompleted.resultMimeType ?? "image/jpeg",
          fileName: initialCompleted.resultFileName ?? "ai-result.jpg",
          generationId: initialCompleted.id,
        }
      : null,
  );
  const [openGenerationId, setOpenGenerationId] = useState<string | null>(null);
  const [parentGenerationId, setParentGenerationId] = useState<string | null>(
    initialCompleted?.id ?? null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(
    initialCompleted?.resultUrl ?? null,
  );
  const [maskDirty, setMaskDirty] = useState(false);
  const [editorResetToken, setEditorResetToken] = useState(0);

  const activeEdit = useMemo(() => getAiEditType(editType), [editType]);
  const activeInput = baseInput;
  const hasPendingJobs = history.some(
    (item) => item.status === "queued" || item.status === "processing",
  );

  const refreshState = useCallback(async () => {
    const response = await fetch("/api/ai-studio/state", { cache: "no-store" });
    const nextState = (await response.json()) as AiStudioState;
    if ("error" in nextState) {
      setError(nextState.error ?? "AI Studio stanje nije dostupno.");
      return;
    }
    setBalanceUnits(nextState.balanceUnits);
    setCreditsExpireAt(nextState.creditsExpireAt);
    setHistory(nextState.generations);
    const latestCompleted = nextState.generations.find(
      (item) => item.status === "completed" && item.resultUrl,
    );
    if (latestCompleted?.resultUrl && latestCompleted.resultStoragePath) {
      setResultUrl(latestCompleted.resultUrl);
      setCurrentResult({
        url: latestCompleted.resultUrl,
        storagePath: latestCompleted.resultStoragePath,
        mimeType: latestCompleted.resultMimeType ?? "image/jpeg",
        fileName: latestCompleted.resultFileName ?? "ai-result.jpg",
        generationId: latestCompleted.id,
      });
      setParentGenerationId(latestCompleted.id);
    }
  }, []);

  const refreshGeneration = useCallback(async (generationId: string) => {
    const response = await fetch(`/api/ai-studio/generations/${generationId}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as {
      error?: string;
      generation?: GenerationHistoryItem;
      balanceUnits?: number;
      creditsExpireAt?: string | null;
    };

    if (data.error) {
      setError(data.error);
      return;
    }
    if (!data.generation) return;

    setHistory((prev) =>
      prev.map((item) => (item.id === data.generation?.id ? data.generation : item)),
    );
    if (typeof data.balanceUnits === "number") setBalanceUnits(data.balanceUnits);
    if ("creditsExpireAt" in data) setCreditsExpireAt(data.creditsExpireAt ?? null);

    if (
      data.generation.status === "completed" &&
      data.generation.resultUrl &&
      data.generation.resultStoragePath
    ) {
      setResultUrl(data.generation.resultUrl);
      setCurrentResult({
        url: data.generation.resultUrl,
        storagePath: data.generation.resultStoragePath,
        mimeType: data.generation.resultMimeType ?? "image/jpeg",
        fileName: data.generation.resultFileName ?? "ai-result.jpg",
        generationId: data.generation.id,
      });
      setParentGenerationId(data.generation.id);
      setNotice("AI obrada je završena.");
    }
    if (data.generation.status === "failed") {
      setError(data.generation.errorMessage ?? "AI obrada nije uspela.");
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(
      () => void refreshState(),
      25 * 60 * 1000,
    );
    const handleFocus = () => void refreshState();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshState]);

  useEffect(() => {
    if (!hasPendingJobs) return;

    const poll = async () => {
      const pendingItems = history.filter(
        (item) => item.status === "queued" || item.status === "processing",
      );
      await Promise.all(pendingItems.map((item) => refreshGeneration(item.id)));
    };

    void poll();
    const intervalId = window.setInterval(() => void poll(), 3500);
    return () => window.clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingJobs, history]);

  useEffect(() => {
    setSelectedOption(activeEdit.options?.[0]?.id ?? "");
    if (!activeEdit.supportsStyles) setStyleId("none");
    if (activeEdit.supportsStyles && styleId === "none") setStyleId("modern");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editType]);

  const handleUpload = async (file: File) => {
    setError("");
    setNotice("");
    const upload = await uploadAiFile(file, "input");
    const url = URL.createObjectURL(file);
    const nextInput = {
      url,
      storagePath: upload.storagePath,
      mimeType: file.type,
      fileName: file.name,
    };
    setBaseInput(nextInput);
    setParentGenerationId(null);
    setResultUrl(null);
    setCurrentResult(null);
    setEditorResetToken((value) => value + 1);
  };

  const setResultAsBaseInput = useCallback((nextInput: UploadedInput) => {
    setBaseInput(nextInput);
    if (nextInput.generationId) setParentGenerationId(nextInput.generationId);
    setMaskDirty(false);
    setEditorResetToken((value) => value + 1);
    setNotice("Rezultat je postavljen kao nova slika za obradu.");
  }, []);

  // Builds the modal payload from a history item. Wrapper so the
  // workspace doesn't have to know about modal types when wiring clicks.
  const openGeneration = useCallback((item: GenerationHistoryItem) => {
    setOpenGenerationId(item.id);
  }, []);

  const closeGenerationModal = useCallback(() => {
    setOpenGenerationId(null);
  }, []);

  const openedGeneration = useMemo<GenerationDetail | null>(() => {
    if (!openGenerationId) return null;
    const item = history.find((entry) => entry.id === openGenerationId);
    if (!item) return null;
    return {
      id: item.id,
      parentGenerationId: item.parentGenerationId,
      editType: item.editType,
      provider: item.provider,
      model: item.model,
      prompt: item.prompt,
      styleId: item.styleId,
      selectedOption: item.selectedOption,
      colorHex: item.colorHex,
      maskInverted: item.maskInverted,
      hasMask: item.hasMask,
      status: item.status,
      unitsCharged: item.unitsCharged,
      freeAttemptIndex: item.freeAttemptIndex,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt,
      completedAt: item.completedAt,
      inputUrl: item.inputUrl,
      resultUrl: item.resultUrl,
      inputDownloadUrl: item.inputDownloadUrl,
      downloadUrl: item.downloadUrl,
      rootFileName: item.rootFileName,
      inputFileName: item.inputFileName,
      resultFileName: item.resultFileName,
      filesExpired: item.filesExpired,
    };
  }, [openGenerationId, history]);

  const parentResultFileName = useMemo(() => {
    if (!openedGeneration?.parentGenerationId) return null;
    return (
      history.find((entry) => entry.id === openedGeneration.parentGenerationId)
        ?.resultFileName ?? null
    );
  }, [openedGeneration, history]);

  const handleModalUseResult = useCallback(
    (gen: GenerationDetail) => {
      if (!gen.resultUrl) return;
      const item = history.find((entry) => entry.id === gen.id);
      if (!item || !item.resultStoragePath) return;
      const nextInput: UploadedInput = {
        url: gen.resultUrl,
        storagePath: item.resultStoragePath,
        mimeType: item.resultMimeType ?? "image/jpeg",
        fileName: gen.resultFileName ?? "ai-result.jpg",
        generationId: gen.id,
      };
      setCurrentResult(nextInput);
      setResultAsBaseInput(nextInput);
      setParentGenerationId(gen.id);
      setResultUrl(gen.resultUrl);
      setOpenGenerationId(null);
    },
    [history, setResultAsBaseInput],
  );

  // "Repeat with same settings" — feed the gen's INPUT image back into
  // the workspace, prefill the controls. parentGenerationId stays set
  // so the free-retry pool against the paid root applies.
  const handleModalRepeat = useCallback(
    (gen: GenerationDetail) => {
      if (!gen.inputUrl) return;
      const item = history.find((entry) => entry.id === gen.id);
      if (!item) return;
      setBaseInput({
        url: gen.inputUrl,
        storagePath: item.inputStoragePath,
        mimeType: item.inputMimeType,
        fileName: gen.inputFileName ?? "slika-za-obradu",
        generationId: gen.parentGenerationId ?? undefined,
      });
      setEditType(gen.editType);
      setProvider(gen.provider);
      if (gen.styleId) setStyleId(gen.styleId);
      if (gen.selectedOption) setSelectedOption(gen.selectedOption);
      if (gen.colorHex) setColorHex(gen.colorHex);
      setPrompt(gen.prompt);
      setParentGenerationId(gen.id);
      setResultUrl(null);
      setCurrentResult(null);
      setMaskDirty(false);
      setEditorResetToken((value) => value + 1);
      setOpenGenerationId(null);
      setNotice("Podešavanja su učitana. Pokrenite obradu kada budete spremni.");
    },
    [history],
  );

  const handleGenerate = async (maskBlob: Blob | null) => {
    if (!activeInput) {
      setError("Prvo uploadujte fotografiju.");
      return;
    }
    if (!parentGenerationId && balanceUnits < activeEdit.units) {
      setError("Nemate dovoljno AI kredita. Dopunite balans pre generisanja.");
      return;
    }

    setPending(true);
    setError("");
    setNotice("");

    try {
      let maskStoragePath: string | null = null;
      if (maskBlob && mode === "advanced" && maskDirty) {
        const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
        const upload = await uploadAiFile(maskFile, "mask");
        maskStoragePath = upload.storagePath;
      }

      const response = await fetch("/api/ai-studio/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editType,
          provider,
          inputStoragePath: activeInput.storagePath,
          inputMimeType: activeInput.mimeType,
          inputFileName: activeInput.fileName,
          maskStoragePath,
          prompt,
          styleId: activeEdit.supportsStyles ? styleId : null,
          selectedOption: selectedOption || null,
          colorHex: activeEdit.supportsColor ? colorHex : null,
          parentGenerationId,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        generationId?: string;
        status?: GenerationHistoryItem["status"];
        balanceUnits?: number;
        unitsCharged?: number;
        freeAttemptIndex?: number | null;
      };

      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.generationId) {
        setError("AI obrada nije pokrenuta.");
        return;
      }

      if (typeof result.balanceUnits === "number") {
        setBalanceUnits(result.balanceUnits);
      }
      const now = new Date();
      setHistory((prev) => [
        {
          id: result.generationId!,
          parentGenerationId,
          editType,
          provider,
          model:
            AI_IMAGE_PROVIDERS.find((item) => item.id === provider)?.label ??
            provider,
          prompt,
          styleId: activeEdit.supportsStyles ? styleId : null,
          status: result.status ?? "queued",
          unitsCharged: result.unitsCharged ?? activeEdit.units,
          freeAttemptIndex: result.freeAttemptIndex ?? null,
          errorMessage: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          startedAt: null,
          completedAt: null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          inputStoragePath: activeInput.storagePath,
          inputMimeType: activeInput.mimeType,
          resultStoragePath: null,
          resultMimeType: null,
          resultUrl: null,
          inputUrl: activeInput.url,
          downloadUrl: null,
          inputDownloadUrl: null,
          filesExpired: false,
          rootFileName: null,
          inputFileName: activeInput.fileName,
          resultFileName: null,
          selectedOption: selectedOption || null,
          colorHex: activeEdit.supportsColor ? colorHex : null,
          maskInverted: false,
          hasMask: Boolean(maskStoragePath),
        },
        ...prev,
      ]);
      setPrompt("");
      setMaskDirty(false);
      setEditorResetToken((value) => value + 1);
      setNotice("AI obrada je pokrenuta. Možete ostati ovde ili se vratiti kasnije.");
      void refreshGeneration(result.generationId);
    } finally {
      setPending(false);
    }
  };

  if ("error" in initialState) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        {initialState.error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground md:text-4xl">
            AI Studio
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            AI obrada fotografija nekretnina: brz simple mode, precizan advanced
            mode sa maskama, selekcijom i crtanjem po slici.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2 text-sm font-semibold text-foreground">
            <Coins className="h-4 w-4 text-accent" />
            {formatCreditsFromUnits(balanceUnits)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {creditsExpireAt
              ? `Dostupno do ${new Date(creditsExpireAt).toLocaleDateString("sr-RS")}`
              : "Krediti nisu aktivni"}
          </p>
          <Link
            href="/portal/ai-studio/krediti"
            className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline"
          >
            Dopuni kredite
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
          {notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <StudioControls
            mode={mode}
            setMode={setMode}
            editType={editType}
            setEditType={setEditType}
            provider={provider}
            setProvider={setProvider}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            styleId={styleId}
            setStyleId={setStyleId}
            colorHex={colorHex}
            setColorHex={setColorHex}
            prompt={prompt}
            setPrompt={setPrompt}
          />

          <AiImageEditor
            mode={mode}
            baseInput={baseInput}
            currentResult={currentResult}
            onUseCurrentResult={setResultAsBaseInput}
            onUpload={handleUpload}
            onGenerate={handleGenerate}
            pending={pending}
            resultUrl={resultUrl}
            parentGenerationId={parentGenerationId}
            resetToken={editorResetToken}
            onMaskDirtyChange={setMaskDirty}
          />
        </div>

        <HistoryPanel
          history={history}
          onOpen={openGeneration}
          onUseResult={(item) => {
            if (!item.resultUrl || !item.resultStoragePath || item.filesExpired) return;
            const nextInput = {
              url: item.resultUrl,
              storagePath: item.resultStoragePath,
              mimeType: item.resultMimeType ?? "image/jpeg",
              fileName: item.resultFileName ?? "ai-result.jpg",
              generationId: item.id,
            };
            setCurrentResult(nextInput);
            setResultAsBaseInput(nextInput);
            setParentGenerationId(item.id);
            setResultUrl(item.resultUrl);
          }}
        />
      </div>

      <GenerationDetailModal
        open={Boolean(openedGeneration)}
        generation={openedGeneration}
        parentResultFileName={parentResultFileName}
        onClose={closeGenerationModal}
        onUseResultAsInput={handleModalUseResult}
        onRepeatWithSameSettings={handleModalRepeat}
      />
    </div>
  );
}

function StudioControls({
  mode,
  setMode,
  editType,
  setEditType,
  provider,
  setProvider,
  selectedOption,
  setSelectedOption,
  styleId,
  setStyleId,
  colorHex,
  setColorHex,
  prompt,
  setPrompt,
}: {
  mode: ToolMode;
  setMode: (mode: ToolMode) => void;
  editType: AiEditType;
  setEditType: (type: AiEditType) => void;
  provider: AiImageProvider;
  setProvider: (provider: AiImageProvider) => void;
  selectedOption: string;
  setSelectedOption: (value: string) => void;
  styleId: string;
  setStyleId: (value: string) => void;
  colorHex: string;
  setColorHex: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
}) {
  const edit = getAiEditType(editType);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Obrada
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {AI_EDIT_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEditType(item.id)}
                className={`rounded-xl border px-3 py-2 text-left transition ${
                  editType === item.id
                    ? "border-accent bg-accent/10"
                    : "border-border/60 bg-background/50 hover:border-accent/40"
                }`}
              >
                <span className="block text-sm font-semibold text-foreground">
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.units === 1 ? "0.5 kredita" : "1 kredit"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Engine
            </p>
            <div className="mt-2 grid gap-2">
              {AI_IMAGE_PROVIDERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProvider(item.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                    provider === item.id
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border/60 bg-background/50 text-muted-foreground hover:border-accent/40"
                  }`}
                >
                  {item.label}
                  {provider === item.id && <Check className="h-4 w-4 text-accent" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Mod
            </p>
            <div className="mt-2 grid grid-cols-2 rounded-xl border border-border/60 bg-background/50 p-1">
              {(["simple", "advanced"] as ToolMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    mode === item ? "bg-accent text-white" : "text-muted-foreground"
                  }`}
                >
                  {item === "simple" ? "Simple" : "Advanced"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {edit.options && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {edit.optionsLabel}
              </p>
              <select
                value={selectedOption}
                onChange={(event) => setSelectedOption(event.target.value)}
                className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {edit.options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {edit.supportsStyles && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Stil
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {AI_STYLE_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStyleId(item.id)}
                    className={`overflow-hidden rounded-xl border text-left text-xs transition ${
                      styleId === item.id
                        ? "border-accent bg-accent/10"
                        : "border-border/60 bg-background/50"
                    }`}
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt=""
                        width={160}
                        height={90}
                        className="h-16 w-full object-cover"
                      />
                    )}
                    <span className="block px-2 py-1.5 text-foreground">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {edit.supportsColor && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Boja
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="color"
                  value={colorHex}
                  onChange={(event) => setColorHex(event.target.value)}
                  className="h-10 w-14 p-1"
                />
                <Input
                  value={colorHex}
                  onChange={(event) => setColorHex(event.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Prompt
        </p>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Npr. dodaj topao moderni nameštaj, sačuvaj perspektivu i prirodno svetlo..."
          className="mt-2 min-h-24"
        />
      </div>
    </div>
  );
}

function AiImageEditor({
  mode,
  baseInput,
  currentResult,
  onUseCurrentResult,
  onUpload,
  onGenerate,
  pending,
  resultUrl,
  parentGenerationId,
  resetToken,
  onMaskDirtyChange,
}: {
  mode: ToolMode;
  baseInput: UploadedInput | null;
  currentResult: UploadedInput | null;
  onUseCurrentResult: (value: UploadedInput) => void;
  onUpload: (file: File) => void;
  onGenerate: (mask: Blob | null) => void;
  pending: boolean;
  resultUrl: string | null;
  parentGenerationId: string | null;
  resetToken: number;
  onMaskDirtyChange: (dirty: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [tool, setTool] = useState<MaskTool>("brush");
  const [brushSize, setBrushSize] = useState(34);
  const [maskOpacity, setMaskOpacity] = useState(0.55);
  const [zoom, setZoom] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const activeImage = baseInput;

  const resetCanvas = useCallback(() => {
    const canvas = maskCanvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image?.naturalWidth) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    onMaskDirtyChange(false);
  }, [onMaskDirtyChange]);

  useEffect(() => {
    resetCanvas();
  }, [activeImage?.url, resetCanvas, resetToken]);

  const pushUndo = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    setUndoStack((prev) => [...prev.slice(-12), canvas.toDataURL("image/png")]);
    setRedoStack([]);
  };

  const restore = (dataUrl: string) => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const image = new window.Image();
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      onMaskDirtyChange(true);
    };
    image.src = dataUrl;
  };

  const pointerToCanvas = (event: PointerEvent<HTMLDivElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawBrush = (x: number, y: number) => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "rgba(184, 80, 70, 0.78)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    onMaskDirtyChange(true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (mode !== "advanced") return;
    const pos = pointerToCanvas(event);
    if (!pos) return;
    pushUndo();
    setDrawing(true);
    if (tool === "brush") drawBrush(pos.x, pos.y);
    if (tool === "rect") setRectStart(pos);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drawing || tool !== "brush") return;
    const pos = pointerToCanvas(event);
    if (pos) drawBrush(pos.x, pos.y);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!drawing) return;
    const pos = pointerToCanvas(event);
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (tool === "rect" && rectStart && pos && ctx) {
      ctx.fillStyle = "rgba(184, 80, 70, 0.78)";
      ctx.fillRect(
        Math.min(rectStart.x, pos.x),
        Math.min(rectStart.y, pos.y),
        Math.abs(pos.x - rectStart.x),
        Math.abs(pos.y - rectStart.y),
      );
      onMaskDirtyChange(true);
    }
    setDrawing(false);
    setRectStart(null);
  };

  const exportMask = async () => {
    const canvas = maskCanvasRef.current;
    if (!canvas || mode !== "advanced") return null;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const source = canvas.getContext("2d");
    const target = exportCanvas.getContext("2d");
    if (!source || !target) return null;

    const image = source.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < image.data.length; i += 4) {
      const selected = image.data[i + 3] > 10;
      image.data[i] = 0;
      image.data[i + 1] = 0;
      image.data[i + 2] = 0;
      image.data[i + 3] = selected ? 0 : 255;
    }
    target.putImageData(image, 0, 0);

    return new Promise<Blob | null>((resolve) =>
      exportCanvas.toBlob(resolve, "image/png"),
    );
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Radna slika</h2>
          <p className="text-sm text-muted-foreground">
            Jedna slika po obradi. Advanced maska je opciona.
          </p>
        </div>
        {currentResult && (
          <button
            type="button"
            onClick={() => onUseCurrentResult(currentResult)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
              baseInput?.storagePath === currentResult.storagePath
                ? "border-accent bg-accent/10 text-accent"
                : "border-border/60 text-muted-foreground"
            }`}
          >
            Koristi rezultat kao sliku za obradu
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </div>

      {mode === "advanced" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-2">
          <ToolButton active={tool === "brush"} onClick={() => setTool("brush")} icon={Brush} label="Brush" />
          <ToolButton active={tool === "rect"} onClick={() => setTool("rect")} icon={RectangleHorizontal} label="Pravougaonik" />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Brush
            <input
              type="range"
              min={8}
              max={90}
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Opacity
            <input
              type="range"
              min={0.15}
              max={0.9}
              step={0.05}
              value={maskOpacity}
              onChange={(event) => setMaskOpacity(Number(event.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <ZoomIn className="h-3.5 w-3.5" />
            <input
              type="range"
              min={0.6}
              max={1.8}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const canvas = maskCanvasRef.current;
              if (!canvas || undoStack.length === 0) return;
              setRedoStack((prev) => [...prev, canvas.toDataURL("image/png")]);
              const last = undoStack[undoStack.length - 1];
              setUndoStack((prev) => prev.slice(0, -1));
              restore(last);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const canvas = maskCanvasRef.current;
              if (!canvas || redoStack.length === 0) return;
              setUndoStack((prev) => [...prev, canvas.toDataURL("image/png")]);
              const last = redoStack[redoStack.length - 1];
              setRedoStack((prev) => prev.slice(0, -1));
              restore(last);
            }}
          >
            <RotateCw className="h-3.5 w-3.5" />
            Redo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetCanvas}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const canvas = maskCanvasRef.current;
              const ctx = canvas?.getContext("2d");
              if (!canvas || !ctx) return;
              pushUndo();
              const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
              for (let i = 0; i < image.data.length; i += 4) {
                const marked = image.data[i + 3] > 10;
                image.data[i] = 184;
                image.data[i + 1] = 80;
                image.data[i + 2] = 70;
                image.data[i + 3] = marked ? 0 : 190;
              }
              ctx.putImageData(image, 0, 0);
              onMaskDirtyChange(true);
            }}
          >
            <CircleDashed className="h-3.5 w-3.5" />
            Invert
          </Button>
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="overflow-auto rounded-2xl border border-border/60 bg-background/50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Slika za obradu
              </p>
              {baseInput?.fileName && (
                <p className="mt-0.5 truncate font-mono text-[0.68rem] text-foreground/60">
                  {baseInput.fileName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {baseInput?.generationId && parentGenerationId && (
                <span className="text-[0.7rem] text-muted-foreground">
                  Iz prethodnog rezultata
                </span>
              )}
              {activeImage && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2 py-1 text-[0.7rem] font-medium text-muted-foreground transition hover:border-accent/40 hover:text-foreground"
                >
                  <Upload className="h-3 w-3" />
                  Promeni sliku
                </button>
              )}
            </div>
          </div>
          {activeImage ? (
            <div
              className="relative mx-auto max-w-full touch-none overflow-hidden rounded-xl bg-black/5"
              style={{ width: `${Math.min(100 * zoom, 180)}%` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={activeImage.url}
                alt="Radna slika"
                className="block h-auto w-full select-none"
                onLoad={resetCanvas}
                draggable={false}
              />
              <canvas
                ref={maskCanvasRef}
                className="absolute inset-0 h-full w-full"
                style={{
                  opacity: mode === "advanced" ? maskOpacity : 0,
                  pointerEvents: "none",
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/70 bg-background/40 text-center transition hover:border-accent/50"
            >
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
              <span className="mt-3 text-sm font-semibold text-foreground">
                Uploadujte fotografiju
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                JPG, PNG ili WebP do 50MB
              </span>
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Rezultat
            </p>
          </div>
          {resultUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="AI rezultat"
                className="h-auto w-full rounded-xl object-contain"
              />
              <a
                href={
                  currentResult?.generationId
                    ? `/api/ai-studio/generations/${currentResult.generationId}/download`
                    : resultUrl
                }
                download
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background"
              >
                <Download className="h-4 w-4" />
                Preuzmi rezultat
              </a>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <Wand2 className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                Rezultat će se prikazati ovde
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Kredit se rezerviše kada obrada krene. Ako AI obrada tehnički
                ne uspe, kredit se automatski vraća.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          variant="accent"
          size="xl"
          disabled={pending || !activeImage}
          onClick={async () => onGenerate(await exportMask())}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate
        </Button>
      </div>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active ? "bg-accent text-white" : "bg-background text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function HistoryPanel({
  history,
  onOpen,
  onUseResult,
}: {
  history: GenerationHistoryItem[];
  onOpen: (item: GenerationHistoryItem) => void;
  onUseResult: (item: GenerationHistoryItem) => void;
}) {
  return (
    <aside className="rounded-2xl border border-border/60 bg-card/80 p-4">
      <h2 className="text-lg font-semibold text-foreground">Istorija</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Klikni na obradu za detalje. Fajlovi su dostupni 30 dana.
      </p>
      <div className="mt-4 space-y-3">
        {history.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
            Još nema AI obrada.
          </div>
        )}
        {history.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border/50 bg-background/50 transition hover:border-accent/40"
          >
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="flex w-full items-start gap-3 rounded-t-xl p-3 text-left"
            >
              {item.resultUrl && !item.filesExpired ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.resultUrl}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Eraser className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {getAiEditType(item.editType).label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString("sr-RS")} ·{" "}
                  {AI_IMAGE_PROVIDERS.find((p) => p.id === item.provider)?.label}
                </p>
                {item.resultFileName && (
                  <p className="mt-0.5 truncate font-mono text-[0.62rem] text-muted-foreground/70">
                    {item.resultFileName}
                  </p>
                )}
                {(item.status === "queued" || item.status === "processing") && (
                  <p className="mt-1 text-xs text-accent">
                    {item.status === "queued" ? "Čeka obradu" : "Obrada u toku"}
                  </p>
                )}
                {item.status === "failed" && (
                  <p className="mt-1 text-xs text-destructive">
                    {item.errorMessage ?? "Obrada nije uspela."}
                  </p>
                )}
                {item.filesExpired && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fajl je istekao.
                  </p>
                )}
              </div>
            </button>
            {item.resultUrl && !item.filesExpired && (
              <div className="flex gap-2 border-t border-border/30 p-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUseResult(item);
                  }}
                >
                  Koristi kao sliku za obradu
                </Button>
                <a
                  href={item.downloadUrl ?? `/api/ai-studio/generations/${item.id}/download`}
                  download
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card/60 px-3 text-[0.8rem] font-medium"
                >
                  Download
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

async function uploadAiFile(file: File, purpose: "input" | "mask") {
  const urlRes = await fetch("/api/ai-studio/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      purpose,
    }),
  });

  if (!urlRes.ok) {
    const { error } = await urlRes.json();
    throw new Error(error || "Upload link nije generisan.");
  }

  const { signedUrl, storagePath } = await urlRes.json();
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: file,
  });

  if (!uploadRes.ok) throw new Error("Upload nije uspeo.");

  return { storagePath };
}
