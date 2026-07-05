"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Brush,
  AlertTriangle,
  Check,
  CircleDashed,
  Coins,
  Download,
  Eraser,
  ImageIcon,
  Loader2,
  Plus,
  RectangleHorizontal,
  RotateCcw,
  RotateCw,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Wand2,
  X,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/portal/empty-state";
import { cn } from "@/lib/utils";
import {
  AI_EDIT_TYPES,
  AI_FREE_REGENERATIONS,
  AI_STYLE_OPTIONS,
  formatCreditsFromUnits,
  formatSelectedOptionLabels,
  getAiEditType,
  getAiEngineLabelForGeneration,
  parseSelectedOptions,
  pickEngineForBilling,
  type AiEditType,
  type AiImageProvider,
} from "@/lib/ai-studio/catalog";
import {
  useAssistantGuideContext,
  type AssistantGuideStage,
} from "@/lib/chat/guide-context";
import { track } from "@/lib/posthog-events";
import {
  GenerationDetailModal,
  type GenerationDetail,
} from "./generation-detail-modal";

type GenerationHistoryItem = {
  id: string;
  parentGenerationId: string | null;
  paidGenerationId: string | null;
  editType: AiEditType;
  provider: AiImageProvider;
  model: string;
  prompt: string;
  styleId: string | null;
  status: "queued" | "processing" | "completed" | "failed";
  unitsCharged: number;
  coveredUnits: number;
  freeAttemptIndex: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  inputStoragePath: string;
  inputMimeType: string;
  referenceStoragePath: string | null;
  referenceMimeType: string | null;
  referenceFileName: string | null;
  referenceImages: ReferenceImageItem[];
  resultStoragePath: string | null;
  resultMimeType: string | null;
  resultUrl: string | null;
  inputUrl: string | null;
  referenceUrl: string | null;
  downloadUrl: string | null;
  inputDownloadUrl: string | null;
  referenceDownloadUrl: string | null;
  filesExpired: boolean;
  rootFileName: string | null;
  inputFileName: string | null;
  resultFileName: string | null;
  parentResultFileName: string | null;
  selectedOption: string | null;
  colorHex: string | null;
  maskInverted: boolean;
  objectMode: ObjectEditMode;
  hasMask: boolean;
};

type ReferenceImageItem = {
  id: string;
  sortOrder: number;
  storagePath: string;
  mimeType: string;
  fileName: string | null;
  url: string | null;
  downloadUrl: string | null;
  isLegacyPreparedReference: boolean;
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
type ObjectEditMode = "insert" | "replace";

type StudioReadiness = {
  canGenerate: boolean;
  blockers: string[];
  warnings: string[];
  buttonLabel: string;
  primaryMessage: string | null;
  tone: "ready" | "warning" | "blocked" | "processing";
};

const MAX_OBJECT_REFERENCE_IMAGES = 5;
const MAX_AI_UPLOAD_BYTES = 50 * 1024 * 1024;
const AI_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const [selectedOption, setSelectedOption] = useState("");
  const [styleId, setStyleId] = useState("modern");
  const [colorHex, setColorHex] = useState("#f2eee8");
  const [prompt, setPrompt] = useState("");
  const [baseInput, setBaseInput] = useState<UploadedInput | null>(null);
  const [referenceInputs, setReferenceInputs] = useState<UploadedInput[]>([]);
  const [objectMode, setObjectMode] = useState<ObjectEditMode>("insert");
  const [currentResult, setCurrentResult] = useState<UploadedInput | null>(null);
  const [openGenerationId, setOpenGenerationId] = useState<string | null>(null);
  const [parentGenerationId, setParentGenerationId] = useState<string | null>(null);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [maskDirty, setMaskDirty] = useState(false);
  const [editorResetToken, setEditorResetToken] = useState(0);
  const baseInputRef = useRef<UploadedInput | null>(null);
  const activeGenerationIdRef = useRef<string | null>(null);
  const resultSuppressedForInputPathRef = useRef<string | null>(null);
  const flightTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const [flightStyle, setFlightStyle] = useState<CSSProperties | null>(null);
  const [flightKey, setFlightKey] = useState(0);
  const [highlightGenerationId, setHighlightGenerationId] = useState<string | null>(
    null,
  );
  const [deletingGenerationId, setDeletingGenerationId] = useState<string | null>(
    null,
  );

  // Set when the user clicks "Resetuj sve" — suppresses the next
  // auto-populate from refreshState / refreshGeneration so the result
  // doesn't sneak back into the workspace via polling or the focus
  // listener. Cleared the moment the user actively populates the
  // workspace again (upload, generate, use-as-input, repeat).
  const workspaceDismissedRef = useRef(false);
  const trackedGenerationOutcomesRef = useRef<Set<string>>(new Set());
  const markWorkspaceActive = useCallback(() => {
    workspaceDismissedRef.current = false;
  }, []);

  const startHistoryFlight = useCallback((generationId: string) => {
    setHighlightGenerationId(generationId);
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = window.setTimeout(
      () => setHighlightGenerationId(null),
      1600,
    );

    const source = document.querySelector<HTMLElement>("[data-ai-generate-button]");
    const target = document.querySelector<HTMLElement>("[data-ai-history-dropzone]");
    if (!source || !target) return;

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    const endX = targetRect.left + Math.min(42, targetRect.width / 2);
    const endY = targetRect.top + targetRect.height / 2;

    setFlightStyle({
      "--ai-flight-x0": `${startX}px`,
      "--ai-flight-y0": `${startY}px`,
      "--ai-flight-x1": `${endX}px`,
      "--ai-flight-y1": `${endY}px`,
    } as CSSProperties);
    setFlightKey((value) => value + 1);
    if (flightTimeoutRef.current) {
      window.clearTimeout(flightTimeoutRef.current);
    }
    flightTimeoutRef.current = window.setTimeout(
      () => setFlightStyle(null),
      900,
    );
  }, []);

  const trackGenerationOutcome = useCallback((generation: GenerationHistoryItem) => {
    if (generation.status !== "completed" && generation.status !== "failed") return;
    const key = `${generation.id}:${generation.status}`;
    if (trackedGenerationOutcomesRef.current.has(key)) return;
    trackedGenerationOutcomesRef.current.add(key);

    const baseProperties = {
      edit_type: generation.editType,
      provider: generation.provider,
      has_mask: generation.hasMask,
      is_regeneration: Boolean(generation.parentGenerationId),
      units_charged: generation.unitsCharged,
    };

    if (generation.status === "completed") {
      track("ai_generation_completed", baseProperties);
      return;
    }

    track("ai_generation_failed", {
      ...baseProperties,
      error_kind: generation.errorMessage ? "processing" : "unknown",
    });
  }, []);

  const activeEdit = useMemo(() => getAiEditType(editType), [editType]);
  const activeInput = baseInput;
  const needsReferenceImage = activeEdit.requiresReferenceImage === true;
  const hasPendingJobs = history.some(
    (item) => item.status === "queued" || item.status === "processing",
  );
  // Free retry is alive while parent.editType === current editType and
  // the paid root's free pool isn't exhausted. Server enforces the same
  // rule — this is just a UI/cost preview gate.
  const linkedParentGenerationId = useMemo(() => {
    if (!parentGenerationId) return null;
    const parent = history.find((item) => item.id === parentGenerationId);
    if (!parent || parent.status !== "completed") return null;
    if (parent.editType !== editType) return null;
    const paidRoot = parent.paidGenerationId ?? parent.id;
    const freeUsed = history.filter(
      (item) =>
        item.paidGenerationId === paidRoot && item.freeAttemptIndex !== null,
    ).length;
    if (freeUsed >= AI_FREE_REGENERATIONS) return null;
    return parentGenerationId;
  }, [editType, history, parentGenerationId]);
  const hasPrompt = prompt.trim().length > 0;
  const activeGeneration = useMemo(
    () =>
      activeGenerationId
        ? history.find((item) => item.id === activeGenerationId) ?? null
        : null,
    [activeGenerationId, history],
  );
  const activeGenerationPendingHydration =
    Boolean(activeGenerationId) && !activeGeneration && !resultUrl;
  const activeGenerationProcessing =
    activeGenerationPendingHydration ||
    activeGeneration?.status === "queued" ||
    activeGeneration?.status === "processing";
  const processingLabel = pending
    ? "Pokrećemo obradu…"
    : activeGeneration?.status === "queued"
      ? "Obrada je u redu čekanja…"
      : activeGenerationProcessing
        ? "Obrada u toku…"
        : null;
  const processingError =
    activeGeneration?.status === "failed"
      ? activeGeneration.errorMessage ?? "AI obrada nije uspela."
      : null;
  const readiness = useMemo(
    () =>
      buildAiStudioReadiness({
        activeInput,
        needsReferenceImage,
        referenceCount: referenceInputs.length,
        editType,
        objectMode,
        maskDirty,
        activeEdit,
        selectedOption,
        balanceUnits,
        linkedParentGenerationId,
        pending,
        processing: activeGenerationProcessing,
      }),
    [
      activeEdit,
      activeGenerationProcessing,
      activeInput,
      balanceUnits,
      editType,
      linkedParentGenerationId,
      maskDirty,
      needsReferenceImage,
      objectMode,
      pending,
      referenceInputs.length,
      selectedOption,
    ],
  );
  const guideStage = useMemo<AssistantGuideStage>(() => {
    if (balanceUnits < activeEdit.units && !linkedParentGenerationId) {
      return "no_credits";
    }
    if (currentResult || resultUrl) return "has_result";
    if (activeInput && hasPrompt) return "ready_to_generate";
    if (activeInput) return "after_upload";
    return "before_upload";
  }, [
    activeEdit.units,
    activeInput,
    balanceUnits,
    currentResult,
    hasPrompt,
    linkedParentGenerationId,
    resultUrl,
  ]);

  useAssistantGuideContext({
    page: "ai_studio",
    stage: guideStage,
    editType,
    balanceUnits,
    hasFiles: Boolean(activeInput),
    hasPrompt,
    missingItems: readiness.blockers,
    readinessWarnings: readiness.warnings,
    canGenerate: readiness.canGenerate,
  });

  useEffect(() => {
    baseInputRef.current = baseInput;
  }, [baseInput]);

  useEffect(() => {
    activeGenerationIdRef.current = activeGenerationId;
  }, [activeGenerationId]);

  useEffect(() => {
    return () => {
      if (flightTimeoutRef.current) window.clearTimeout(flightTimeoutRef.current);
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const requestedTool = new URLSearchParams(window.location.search).get("tool");
    if (isAiEditTypeId(requestedTool)) {
      setEditType(requestedTool);
    }
  }, []);

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
    if (workspaceDismissedRef.current) return;
    const activeWorkspaceInput = baseInputRef.current;
    if (!activeWorkspaceInput) return;
    const activeId = activeGenerationIdRef.current;
    const activeFromState = activeId
      ? nextState.generations.find((item) => item.id === activeId)
      : null;
    if (
      activeFromState?.status === "queued" ||
      activeFromState?.status === "processing" ||
      activeFromState?.status === "failed"
    ) {
      return;
    }
    if (
      resultSuppressedForInputPathRef.current &&
      resultSuppressedForInputPathRef.current === activeWorkspaceInput.storagePath
    ) {
      return;
    }
    const latestCompleted = nextState.generations.find(
      (item) => item.status === "completed" && item.resultUrl,
    );
    const latestMatchesWorkspace =
      latestCompleted &&
      (latestCompleted.inputStoragePath === activeWorkspaceInput.storagePath ||
        latestCompleted.parentGenerationId === activeWorkspaceInput.generationId);
    if (
      latestCompleted &&
      !latestMatchesWorkspace
    ) {
      return;
    }
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
      setActiveGenerationId(latestCompleted.id);
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

    trackGenerationOutcome(data.generation);

    setHistory((prev) =>
      prev.map((item) => (item.id === data.generation?.id ? data.generation : item)),
    );
    if (typeof data.balanceUnits === "number") setBalanceUnits(data.balanceUnits);
    if ("creditsExpireAt" in data) setCreditsExpireAt(data.creditsExpireAt ?? null);

    const activeWorkspaceInput = baseInputRef.current;
    const resultMatchesWorkspace =
      activeWorkspaceInput &&
      (data.generation.inputStoragePath === activeWorkspaceInput.storagePath ||
        data.generation.parentGenerationId === activeWorkspaceInput.generationId);

    if (
      data.generation.status === "completed" &&
      data.generation.resultUrl &&
      data.generation.resultStoragePath &&
      !workspaceDismissedRef.current &&
      resultMatchesWorkspace
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
      setActiveGenerationId(data.generation.id);
      resultSuppressedForInputPathRef.current = null;
      setNotice("AI obrada je završena.");
    }
    if (data.generation.status === "failed") {
      setActiveGenerationId(data.generation.id);
      setError(data.generation.errorMessage ?? "AI obrada nije uspela.");
    }
  }, [trackGenerationOutcome]);

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
    // Multi-select edits start with no selection (customer must pick).
    // Single-select edits seed the first option as before.
    setSelectedOption(
      activeEdit.multiSelect ? "" : (activeEdit.options?.[0]?.id ?? ""),
    );
    if (!activeEdit.supportsStyles) setStyleId("none");
    if (activeEdit.supportsStyles && styleId === "none") setStyleId("modern");
    if (!activeEdit.requiresReferenceImage) {
      setReferenceInputs([]);
      setObjectMode("insert");
    }
    // Atmospheric edits operate globally — mask is meaningless. Force
    // simple mode when the new type doesn't support a mask, otherwise
    // leave the mode where the customer left it.
    if (activeEdit.supportsMask === false) setMode("simple");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editType]);

  useEffect(() => {
    if (editType === "object_insertion" && objectMode === "replace") {
      setMode("advanced");
    }
  }, [editType, objectMode]);

  // Wipes the workspace back to defaults — radna slika, rezultat,
  // promptovi, kontrole, modal. Ne dira history ni balance. Sets the
  // dismissed flag so a focus-fired or interval-fired refresh doesn't
  // immediately re-populate the cleared workspace.
  const handleClearAll = useCallback(() => {
    setBaseInput(null);
    setReferenceInputs([]);
    setObjectMode("insert");
    setCurrentResult(null);
    setResultUrl(null);
    setParentGenerationId(null);
    setActiveGenerationId(null);
    setEditType("virtual_staging");
    setSelectedOption("");
    setStyleId("modern");
    setColorHex("#f2eee8");
    setPrompt("");
    setMode("simple");
    setMaskDirty(false);
    setEditorResetToken((value) => value + 1);
    setOpenGenerationId(null);
    setError("");
    setNotice("Radna slika i podešavanja su obrisani.");
    workspaceDismissedRef.current = true;
    resultSuppressedForInputPathRef.current = null;
  }, []);

  const handleUpload = async (file: File) => {
    setError("");
    setNotice("");
    const validationError = validateAiImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    markWorkspaceActive();
    resultSuppressedForInputPathRef.current = null;
    setParentGenerationId(null);
    setActiveGenerationId(null);
    try {
      const upload = await uploadAiFile(file, "input");
      const url = URL.createObjectURL(file);
      const nextInput = {
        url,
        storagePath: upload.storagePath,
        mimeType: file.type,
        fileName: file.name,
      };
      setBaseInput(nextInput);
      setResultUrl(null);
      setCurrentResult(null);
      setActiveGenerationId(null);
      setEditorResetToken((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload nije uspeo.");
    }
  };

  const handleReferenceUpload = async (files: File[]) => {
    setError("");
    setNotice("");
    markWorkspaceActive();
    if (files.length === 0) return;
    const invalid = files.find((file) => validateAiImageFile(file));
    if (invalid) {
      setError(validateAiImageFile(invalid) ?? "Fajl nije podržan.");
      return;
    }
    const remaining = MAX_OBJECT_REFERENCE_IMAGES - referenceInputs.length;
    if (remaining <= 0) {
      setError("Možete dodati najviše 5 slika komada po obradi.");
      return;
    }
    const selected = files.slice(0, remaining);
    if (files.length > remaining) {
      setNotice(`Dodato je ${remaining} slika. Maksimum je 5 uglova istog komada.`);
    }
    try {
      const uploads = await Promise.all(
        selected.map(async (file) => {
          const upload = await uploadAiFile(file, "reference");
          return {
            url: URL.createObjectURL(file),
            storagePath: upload.storagePath,
            mimeType: file.type,
            fileName: file.name,
          };
        }),
      );
      setReferenceInputs((prev) => [...prev, ...uploads]);
      if (referenceInputs.length + uploads.length > 1) {
        setNotice(
          "Prva slika je glavna referenca. Dodatni uglovi moraju prikazivati isti komad/model/boju/materijal; ako se razlikuju, AI prati prvu.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload slike komada nije uspeo.");
    }
  };

  const handleReferenceRemove = useCallback((index: number) => {
    setReferenceInputs((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const handleReferenceMakePrimary = useCallback((index: number) => {
    setReferenceInputs((prev) => {
      const selected = prev[index];
      if (!selected) return prev;
      return [selected, ...prev.filter((_, itemIndex) => itemIndex !== index)];
    });
    setNotice(
      "Izabrana slika je postavljena kao glavna referenca. Ostale slike se koriste samo kao pomoćni uglovi.",
    );
  }, []);

  const setResultAsBaseInput = useCallback((nextInput: UploadedInput) => {
    markWorkspaceActive();
    resultSuppressedForInputPathRef.current = null;
    setBaseInput(nextInput);
    if (nextInput.generationId) setParentGenerationId(nextInput.generationId);
    setActiveGenerationId(null);
    setMaskDirty(false);
    setEditorResetToken((value) => value + 1);
    setNotice("Rezultat je postavljen kao nova slika za obradu.");
  }, [markWorkspaceActive]);

  useEffect(() => {
    const sourceGenerationId = new URLSearchParams(window.location.search).get(
      "sourceGeneration",
    );
    if (!sourceGenerationId) return;

    const controller = new AbortController();
    const hydrateSourceGeneration = async () => {
      try {
        const response = await fetch(
          `/api/ai-studio/generations/${sourceGenerationId}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = (await response.json()) as {
          error?: string;
          generation?: GenerationHistoryItem;
        };
        if (data.error) {
          setError(data.error);
          return;
        }
        const generation = data.generation;
        if (
          !generation ||
          generation.status !== "completed" ||
          !generation.resultUrl ||
          !generation.resultStoragePath ||
          generation.filesExpired
        ) {
          setError("Izabrana AI kreacija nije dostupna kao radna slika.");
          return;
        }
        setHistory((prev) =>
          prev.some((item) => item.id === generation.id)
            ? prev.map((item) => (item.id === generation.id ? generation : item))
            : [generation, ...prev],
        );
        const nextInput: UploadedInput = {
          url: generation.resultUrl,
          storagePath: generation.resultStoragePath,
          mimeType: generation.resultMimeType ?? "image/jpeg",
          fileName: generation.resultFileName ?? "ai-result.jpg",
          generationId: generation.id,
        };
        setCurrentResult(nextInput);
        setResultAsBaseInput(nextInput);
        setParentGenerationId(generation.id);
        setResultUrl(generation.resultUrl);
        setNotice("AI kreacija je postavljena kao nova radna slika.");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("AI kreacija trenutno nije dostupna.");
      }
    };

    void hydrateSourceGeneration();
    return () => controller.abort();
  }, [setResultAsBaseInput]);

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
      objectMode: item.objectMode ?? "insert",
      maskInverted: item.maskInverted,
      hasMask: item.hasMask,
      status: item.status,
      unitsCharged: item.unitsCharged,
      freeAttemptIndex: item.freeAttemptIndex,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt,
      completedAt: item.completedAt,
      inputUrl: item.inputUrl,
      referenceStoragePath: item.referenceStoragePath,
      referenceUrl: item.referenceUrl,
      referenceImages: item.referenceImages ?? [],
      resultUrl: item.resultUrl,
      inputDownloadUrl: item.inputDownloadUrl,
      referenceDownloadUrl: item.referenceDownloadUrl,
      downloadUrl: item.downloadUrl,
      rootFileName: item.rootFileName,
      inputFileName: item.inputFileName,
      referenceFileName: item.referenceFileName,
      resultFileName: item.resultFileName,
      parentResultFileName: item.parentResultFileName,
      filesExpired: item.filesExpired,
    };
  }, [openGenerationId, history]);

  const parentResultFileName = useMemo(() => {
    if (!openedGeneration) return null;
    return (
      openedGeneration.parentResultFileName ??
      history.find((entry) => entry.id === openedGeneration.parentGenerationId)
        ?.resultFileName ??
      null
    );
  }, [openedGeneration, history]);

  // Best-effort client estimate of free retries left on this paid root.
  // Server is authoritative — if history doesn't include older
  // generations from the same chain, this can over-report; server will
  // reject and charge. Good enough for the modal hint.
  const openedFreeRetriesRemaining = useMemo(() => {
    if (!openedGeneration) return 0;
    const item = history.find((entry) => entry.id === openedGeneration.id);
    if (!item) return 0;
    const paidRoot = item.paidGenerationId ?? item.id;
    const freeUsed = history.filter(
      (entry) =>
        entry.paidGenerationId === paidRoot && entry.freeAttemptIndex !== null,
    ).length;
    return Math.max(0, AI_FREE_REGENERATIONS - freeUsed);
  }, [openedGeneration, history]);

  const costPreview = useMemo(
    () => computeCostPreview(history, linkedParentGenerationId, editType),
    [history, linkedParentGenerationId, editType],
  );

  const handleModalUseResult = useCallback(
    (gen: GenerationDetail) => {
      if (!gen.resultUrl) return;
      const item = history.find((entry) => entry.id === gen.id);
      if (!item || !item.resultStoragePath) return;
      markWorkspaceActive();
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
      setActiveGenerationId(null);
      setOpenGenerationId(null);
    },
    [history, setResultAsBaseInput, markWorkspaceActive],
  );

  // "Repeat with same settings" — feed the gen's INPUT image back into
  // the workspace, prefill the controls. parentGenerationId stays set
  // so the free-retry pool against the paid root applies.
  const handleModalRepeat = useCallback(
    (gen: GenerationDetail) => {
      if (!gen.inputUrl) return;
      const item = history.find((entry) => entry.id === gen.id);
      if (!item) return;
      markWorkspaceActive();
      resultSuppressedForInputPathRef.current = item.inputStoragePath;
      setBaseInput({
        url: gen.inputUrl,
        storagePath: item.inputStoragePath,
        mimeType: item.inputMimeType,
        fileName: gen.inputFileName ?? "slika-za-obradu",
        generationId: gen.parentGenerationId ?? undefined,
      });
      setReferenceInputs(
        gen.referenceImages.length > 0
          ? gen.referenceImages
              .filter((reference) => reference.url)
              .map((reference) => ({
                url: reference.url!,
                storagePath: reference.storagePath,
                mimeType: reference.mimeType,
                fileName:
                  reference.fileName ??
                  (reference.sortOrder === 0
                    ? "komad-za-ubacivanje"
                    : `komad-ugao-${reference.sortOrder + 1}`),
              }))
          : gen.referenceUrl && item.referenceStoragePath
            ? [
                {
                  url: gen.referenceUrl,
                  storagePath: item.referenceStoragePath,
                  mimeType: item.referenceMimeType ?? "image/jpeg",
                  fileName: gen.referenceFileName ?? "komad-za-ubacivanje",
                },
              ]
            : [],
      );
      setEditType(gen.editType);
      setObjectMode(gen.objectMode);
      if (gen.styleId) setStyleId(gen.styleId);
      if (gen.selectedOption) setSelectedOption(gen.selectedOption);
      if (gen.colorHex) setColorHex(gen.colorHex);
      setPrompt(gen.prompt);
      setParentGenerationId(gen.id);
      setResultUrl(null);
      setCurrentResult(null);
      setActiveGenerationId(null);
      setMaskDirty(false);
      setEditorResetToken((value) => value + 1);
      setOpenGenerationId(null);
      setNotice("Podešavanja su učitana. Pokrenite obradu kada budete spremni.");
    },
    [history, markWorkspaceActive],
  );

  const handleDeleteGeneration = useCallback(
    async (item: GenerationHistoryItem | GenerationDetail) => {
      if (item.status === "queued" || item.status === "processing") {
        setError("Obrada je još u toku. Sačekajte završetak pre brisanja.");
        return;
      }
      const confirmed = window.confirm(
        "Trajno obrisati ovu AI kreaciju i njene fajlove? Ova radnja ne može da se poništi.",
      );
      if (!confirmed) return;

      const previousHistory = history;
      const previousCurrentResult = currentResult;
      const previousResultUrl = resultUrl;
      const previousActiveGenerationId = activeGenerationId;
      const previousParentGenerationId = parentGenerationId;
      setDeletingGenerationId(item.id);
      setHistory((prev) => prev.filter((entry) => entry.id !== item.id));
      setOpenGenerationId((current) => (current === item.id ? null : current));
      if (activeGenerationId === item.id) setActiveGenerationId(null);
      if (currentResult?.generationId === item.id) {
        setCurrentResult(null);
        setResultUrl(null);
      }
      if (parentGenerationId === item.id) setParentGenerationId(null);
      setError("");

      try {
        const response = await fetch(`/api/ai-studio/generations/${item.id}`, {
          method: "DELETE",
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok || data.error) {
          setHistory(previousHistory);
          setCurrentResult(previousCurrentResult);
          setResultUrl(previousResultUrl);
          setActiveGenerationId(previousActiveGenerationId);
          setParentGenerationId(previousParentGenerationId);
          setError(data.error ?? "Brisanje nije uspelo.");
          return;
        }
        setNotice("AI kreacija je trajno obrisana.");
      } catch {
        setHistory(previousHistory);
        setCurrentResult(previousCurrentResult);
        setResultUrl(previousResultUrl);
        setActiveGenerationId(previousActiveGenerationId);
        setParentGenerationId(previousParentGenerationId);
        setError("Brisanje nije uspelo. Pokušajte ponovo.");
      } finally {
        setDeletingGenerationId(null);
      }
    },
    [activeGenerationId, currentResult, history, parentGenerationId, resultUrl],
  );

  const handleGenerate = async (maskBlob: Blob | null) => {
    if (!readiness.canGenerate) {
      setError(readiness.primaryMessage ?? "Proverite šta nedostaje pre generisanja.");
      return;
    }
    if (!activeInput) {
      setError("Prvo uploadujte fotografiju.");
      return;
    }
    if (needsReferenceImage && referenceInputs.length === 0) {
      setError("Dodajte sliku nameštaja/dekora koji želite da ubacite u enterijer.");
      return;
    }
    if (
      editType === "object_insertion" &&
      objectMode === "replace" &&
      (!maskBlob || mode !== "advanced" || !maskDirty)
    ) {
      setError(
        "Za zamenu označite postojeći komad koji menjamo. Maska ne mora biti savršena; sistem će proširiti lokalnu zonu za novi komad, senku i kontakt.",
      );
      return;
    }
    if (
      activeEdit.multiSelect &&
      parseSelectedOptions(selectedOption).length === 0
    ) {
      setError(`Izaberite barem jednu kategoriju u "${activeEdit.optionsLabel ?? "opcije"}".`);
      return;
    }
    if (!linkedParentGenerationId && balanceUnits < activeEdit.units) {
      setError("Nemate dovoljno AI kredita. Dopunite balans pre generisanja.");
      return;
    }

    setPending(true);
    setError("");
    setResultUrl(null);
    setCurrentResult(null);
    resultSuppressedForInputPathRef.current = activeInput.storagePath;
    const objectInsertWithoutMask =
      editType === "object_insertion" && objectMode === "insert" && !maskDirty;
    setNotice(
      objectInsertWithoutMask
        ? "Generišemo bez maske: AI sam bira poziciju komada, pa rezultat može biti manje predvidljiv."
        : "",
    );
    markWorkspaceActive();

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
          inputStoragePath: activeInput.storagePath,
          inputMimeType: activeInput.mimeType,
          inputFileName: activeInput.fileName,
          referenceImages: needsReferenceImage
            ? referenceInputs.map((reference) => ({
                storagePath: reference.storagePath,
                mimeType: reference.mimeType,
                fileName: reference.fileName,
              }))
            : null,
          referenceStoragePath: needsReferenceImage
            ? referenceInputs[0]?.storagePath
            : null,
          referenceMimeType: needsReferenceImage
            ? referenceInputs[0]?.mimeType
            : null,
          referenceFileName: needsReferenceImage
            ? referenceInputs[0]?.fileName
            : null,
          maskStoragePath,
          objectMode: editType === "object_insertion" ? objectMode : null,
          prompt,
          styleId: activeEdit.supportsStyles ? styleId : null,
          selectedOption: selectedOption || null,
          colorHex: activeEdit.supportsColor ? colorHex : null,
          parentGenerationId: linkedParentGenerationId,
          referenceGuidanceAcknowledged:
            editType === "object_insertion" && referenceInputs.length > 1,
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
      setActiveGenerationId(result.generationId);
      startHistoryFlight(result.generationId);

      const expectedEngine = pickEngineForBilling(
        Boolean(linkedParentGenerationId),
      );
      track("ai_generation_started", {
        edit_type: editType,
        provider: expectedEngine.provider,
        model: expectedEngine.model,
        mode,
        has_mask: Boolean(maskStoragePath),
        has_style: Boolean(activeEdit.supportsStyles && styleId !== "none"),
        has_selected_option: Boolean(selectedOption),
        has_color: Boolean(activeEdit.supportsColor),
        has_reference_image: Boolean(needsReferenceImage && referenceInputs.length > 0),
        reference_image_count: needsReferenceImage ? referenceInputs.length : 0,
        object_mode: editType === "object_insertion" ? objectMode : null,
        is_regeneration: Boolean(linkedParentGenerationId),
        units_charged: result.unitsCharged ?? activeEdit.units,
      });

      if (typeof result.balanceUnits === "number") {
        setBalanceUnits(result.balanceUnits);
      }
      const now = new Date();
      setHistory((prev) => [
        {
          id: result.generationId!,
          parentGenerationId: linkedParentGenerationId,
          paidGenerationId: null,
          editType,
          provider: expectedEngine.provider,
          model: expectedEngine.model,
          prompt,
          styleId: activeEdit.supportsStyles ? styleId : null,
          status: result.status ?? "queued",
          unitsCharged: result.unitsCharged ?? activeEdit.units,
          coveredUnits: activeEdit.units,
          freeAttemptIndex: result.freeAttemptIndex ?? null,
          errorMessage: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          startedAt: null,
          completedAt: null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          inputStoragePath: activeInput.storagePath,
          inputMimeType: activeInput.mimeType,
          referenceStoragePath: needsReferenceImage
            ? referenceInputs[0]?.storagePath ?? null
            : null,
          referenceMimeType: needsReferenceImage
            ? referenceInputs[0]?.mimeType ?? null
            : null,
          referenceFileName: needsReferenceImage
            ? referenceInputs[0]?.fileName ?? null
            : null,
          referenceImages: needsReferenceImage
            ? referenceInputs.map((reference, index) => ({
                id: `local-reference-${index}`,
                sortOrder: index,
                storagePath: reference.storagePath,
                mimeType: reference.mimeType,
                fileName: reference.fileName,
                url: reference.url,
                downloadUrl: null,
                isLegacyPreparedReference: reference.storagePath.includes(
                  "/prepared-references/",
                ),
              }))
            : [],
          resultStoragePath: null,
          resultMimeType: null,
          resultUrl: null,
          inputUrl: activeInput.url,
          referenceUrl: needsReferenceImage ? referenceInputs[0]?.url ?? null : null,
          downloadUrl: null,
          inputDownloadUrl: null,
          referenceDownloadUrl: null,
          filesExpired: false,
          rootFileName: null,
          inputFileName: activeInput.fileName,
          resultFileName: null,
          parentResultFileName: null,
          selectedOption: selectedOption || null,
          colorHex: activeEdit.supportsColor ? colorHex : null,
          maskInverted: false,
          objectMode: editType === "object_insertion" ? objectMode : "insert",
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
      {flightStyle && (
        <div
          key={flightKey}
          className="ai-history-flight"
          style={flightStyle}
          aria-hidden="true"
        >
          <Sparkles className="h-4 w-4" />
          <span>AI obrada</span>
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
            AI Studio · Beta
          </p>
          <h1 className="mt-1 font-heading text-3xl text-foreground md:text-4xl">
            Brza obrada fotografija
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Brz simple mode, precizan advanced mode sa maskama, selekcijom i
            crtanjem po slici. Krediti važe 12 meseci od poslednje dopune.
          </p>
        </div>
        <BalanceCard
          balanceUnits={balanceUnits}
          creditsExpireAt={creditsExpireAt}
        />
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

      <RetryStatusBanner
        history={history}
        parentGenerationId={parentGenerationId}
        linkedParentGenerationId={linkedParentGenerationId}
        editType={editType}
        onCancel={() => setParentGenerationId(null)}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <StudioControls
            mode={mode}
            setMode={setMode}
            editType={editType}
            setEditType={setEditType}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            styleId={styleId}
            setStyleId={setStyleId}
            colorHex={colorHex}
            setColorHex={setColorHex}
            prompt={prompt}
            setPrompt={setPrompt}
            objectMode={objectMode}
          />

          <AiImageEditor
            mode={mode}
            editType={editType}
            baseInput={baseInput}
            referenceInputs={referenceInputs}
            objectMode={objectMode}
            onObjectModeChange={setObjectMode}
            currentResult={currentResult}
            onUseCurrentResult={setResultAsBaseInput}
            onUpload={handleUpload}
            onReferenceUpload={handleReferenceUpload}
            onReferenceRemove={handleReferenceRemove}
            onReferenceMakePrimary={handleReferenceMakePrimary}
            onGenerate={handleGenerate}
            onClearAll={handleClearAll}
            pending={pending}
            processingLabel={processingLabel}
            processingError={processingError}
            resultUrl={resultUrl}
            parentGenerationId={linkedParentGenerationId}
            resetToken={editorResetToken}
            onMaskDirtyChange={setMaskDirty}
            costPreview={costPreview}
            readiness={readiness}
          />
        </div>

        <HistoryPanel
          history={history}
          highlightedId={highlightGenerationId}
          deletingId={deletingGenerationId}
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
          onDelete={handleDeleteGeneration}
        />
      </div>

      <GenerationDetailModal
        open={Boolean(openedGeneration)}
        generation={openedGeneration}
        parentResultFileName={parentResultFileName}
        freeRetriesRemaining={openedFreeRetriesRemaining}
        onClose={closeGenerationModal}
        onUseResultAsInput={handleModalUseResult}
        onRepeatWithSameSettings={handleModalRepeat}
        onDelete={handleDeleteGeneration}
        deleting={Boolean(
          openedGeneration && deletingGenerationId === openedGeneration.id,
        )}
      />
    </div>
  );
}

function StudioControls({
  mode,
  setMode,
  editType,
  setEditType,
  selectedOption,
  setSelectedOption,
  styleId,
  setStyleId,
  colorHex,
  setColorHex,
  prompt,
  setPrompt,
  objectMode,
}: {
  mode: ToolMode;
  setMode: (mode: ToolMode) => void;
  editType: AiEditType;
  setEditType: (type: AiEditType) => void;
  selectedOption: string;
  setSelectedOption: (value: string) => void;
  styleId: string;
  setStyleId: (value: string) => void;
  colorHex: string;
  setColorHex: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  objectMode: ObjectEditMode;
}) {
  const edit = getAiEditType(editType);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5 shadow-[0_4px_16px_rgba(28,26,25,0.03)]">
      <div className="grid gap-5 lg:grid-cols-3">
        <div>
          <ControlLabel>Obrada</ControlLabel>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {AI_EDIT_TYPES.map((item) => (
              <SelectableTile
                key={item.id}
                active={editType === item.id}
                onClick={() => setEditType(item.id)}
                title={item.label}
                subtitle={formatCreditsFromUnits(item.units)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {edit.supportsMask !== false && (
            <div>
              <ControlLabel>Mod</ControlLabel>
              <div className="mt-2 grid grid-cols-2 rounded-xl border border-border/40 bg-card/40 p-1">
                {(["simple", "advanced"] as ToolMode[]).map((item) => {
                  const disabled =
                    edit.requiresReferenceImage &&
                    objectMode === "replace" &&
                    item === "simple";
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={disabled}
                      onClick={() => setMode(item)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                        mode === item
                          ? "bg-accent text-accent-foreground shadow-[0_8px_24px_-12px_rgba(184,131,99,0.45)]"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item === "simple" ? "Simple" : "Advanced"}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[0.68rem] text-muted-foreground">
                {edit.requiresReferenceImage
                  ? objectMode === "replace"
                    ? "Označite postojeći komad koji menjamo; sistem će proširiti lokalnu zonu za novi komad, senku i kontakt."
                    : "Maska je smernica za poziciju; AI može blago proširiti zonu zbog senke, kontakta i prirodnog uklapanja."
                  : "Advanced otključava masku za precizno označavanje."}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {edit.options &&
            (edit.multiSelect ? (
              <div>
                <ControlLabel>{edit.optionsLabel}</ControlLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {edit.options.map((item) => {
                    const ids = parseSelectedOptions(selectedOption);
                    const isOn = ids.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSelectedOption(toggleOptionId(selectedOption, item.id))
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          isOn
                            ? "border-accent bg-accent/15 text-foreground"
                            : "border-border/40 bg-card/40 text-muted-foreground hover:border-accent/40 hover:text-foreground",
                        )}
                      >
                        {isOn && <Check className="mr-1 inline-block h-3 w-3 text-accent" />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">
                  Označite jednu ili više kategorija.
                </p>
              </div>
            ) : (
              <div>
                <ControlLabel>{edit.optionsLabel}</ControlLabel>
                <select
                  value={selectedOption}
                  onChange={(event) => setSelectedOption(event.target.value)}
                  className="mt-2 h-9 w-full rounded-lg border border-border/40 bg-card/40 px-3 text-sm outline-none transition-colors hover:border-accent/40 focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {edit.options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

          {edit.supportsStyles && (
            <div>
              <ControlLabel>Stil</ControlLabel>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {AI_STYLE_OPTIONS.filter((item) => item.id !== "none").map(
                  (item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStyleId(item.id)}
                      className={cn(
                        "overflow-hidden rounded-xl border text-left text-xs transition-all",
                        styleId === item.id
                          ? "border-accent bg-accent/5 shadow-[0_8px_24px_-12px_rgba(184,131,99,0.35)]"
                          : "border-border/40 bg-card/40 hover:border-accent/40",
                      )}
                    >
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={`Primer stila: ${item.label}`}
                          width={160}
                          height={90}
                          className="h-16 w-full object-cover"
                        />
                      )}
                      <span
                        className={cn(
                          "block px-2 py-1.5 font-medium",
                          styleId === item.id
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {edit.supportsColor && (
            <div>
              <ControlLabel>Boja</ControlLabel>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="color"
                  value={colorHex}
                  onChange={(event) => setColorHex(event.target.value)}
                  className="h-10 w-14 cursor-pointer p-1"
                />
                <Input
                  value={colorHex}
                  onChange={(event) => setColorHex(event.target.value)}
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <ControlLabel>Prompt</ControlLabel>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={
            edit.promptPlaceholder ?? "Dodatne instrukcije (opciono)"
          }
          className="mt-2 min-h-24"
        />
      </div>
    </div>
  );
}

function AiImageEditor({
  mode,
  editType,
  baseInput,
  referenceInputs,
  objectMode,
  currentResult,
  onUseCurrentResult,
  onUpload,
  onReferenceUpload,
  onReferenceRemove,
  onReferenceMakePrimary,
  onObjectModeChange,
  onGenerate,
  onClearAll,
  pending,
  processingLabel,
  processingError,
  resultUrl,
  parentGenerationId,
  resetToken,
  onMaskDirtyChange,
  costPreview,
  readiness,
}: {
  mode: ToolMode;
  editType: AiEditType;
  baseInput: UploadedInput | null;
  referenceInputs: UploadedInput[];
  objectMode: ObjectEditMode;
  currentResult: UploadedInput | null;
  onUseCurrentResult: (value: UploadedInput) => void;
  onUpload: (file: File) => void;
  onReferenceUpload: (files: File[]) => void;
  onReferenceRemove: (index: number) => void;
  onReferenceMakePrimary: (index: number) => void;
  onObjectModeChange: (mode: ObjectEditMode) => void;
  onGenerate: (mask: Blob | null) => void;
  onClearAll: () => void;
  pending: boolean;
  processingLabel: string | null;
  processingError: string | null;
  resultUrl: string | null;
  parentGenerationId: string | null;
  resetToken: number;
  onMaskDirtyChange: (dirty: boolean) => void;
  costPreview: { unitsCharged: number; freeAttemptIndex: number | null } | null;
  readiness: StudioReadiness;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const referenceFileRef = useRef<HTMLInputElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [tool, setTool] = useState<MaskTool>("brush");
  const [brushSize, setBrushSize] = useState(34);
  const [maskOpacity, setMaskOpacity] = useState(0.55);
  const [zoom, setZoom] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [brushPreview, setBrushPreview] = useState<{
    x: number;
    y: number;
    radius: number;
  } | null>(null);
  const [rectStart, setRectStart] = useState<{
    x: number;
    y: number;
    displayX: number;
    displayY: number;
  } | null>(null);
  const [rectPreview, setRectPreview] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const activeImage = baseInput;
  const edit = getAiEditType(editType);
  const needsReferenceImage = edit.requiresReferenceImage === true;
  const [baseDragOver, setBaseDragOver] = useState(false);
  const [imageFrame, setImageFrame] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  const imageDims =
    imageFrame && imageFrame.url === activeImage?.url
      ? { width: imageFrame.width, height: imageFrame.height }
      : null;

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
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;
    return {
      x: (displayX / rect.width) * canvas.width,
      y: (displayY / rect.height) * canvas.height,
      displayX,
      displayY,
      displayRadius: Math.max(4, brushSize * (rect.width / canvas.width)),
    };
  };

  const buildRectPreview = (
    start: { displayX: number; displayY: number },
    end: { displayX: number; displayY: number },
  ) => ({
    left: Math.min(start.displayX, end.displayX),
    top: Math.min(start.displayY, end.displayY),
    width: Math.abs(end.displayX - start.displayX),
    height: Math.abs(end.displayY - start.displayY),
  });

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
    if (tool === "brush") {
      setBrushPreview({
        x: pos.displayX,
        y: pos.displayY,
        radius: pos.displayRadius,
      });
    }
    pushUndo();
    setDrawing(true);
    if (tool === "brush") drawBrush(pos.x, pos.y);
    if (tool === "rect") {
      setRectStart(pos);
      setRectPreview(buildRectPreview(pos, pos));
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (mode !== "advanced") return;
    const pos = pointerToCanvas(event);
    if (pos && tool === "brush") {
      setBrushPreview({
        x: pos.displayX,
        y: pos.displayY,
        radius: pos.displayRadius,
      });
    }
    if (drawing && tool === "rect" && rectStart && pos) {
      setRectPreview(buildRectPreview(rectStart, pos));
      return;
    }
    if (!drawing || tool !== "brush") return;
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
    setRectPreview(null);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    setBrushPreview(null);
    setRectPreview(null);
    handlePointerUp(event);
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

  const getDroppedFiles = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    return Array.from(event.dataTransfer.files ?? []);
  };

  const handleBaseDrop = (event: DragEvent<HTMLDivElement>) => {
    setBaseDragOver(false);
    const [file] = getDroppedFiles(event);
    if (pending) return;
    if (file) onUpload(file);
  };
  const previewFrameStyle = imageDims
    ? {
        aspectRatio: `${imageDims.width} / ${imageDims.height}`,
        maxWidth: `min(100%, ${Math.max(
          260,
          Math.round((imageDims.width / imageDims.height) * 620),
        )}px)`,
      }
    : { aspectRatio: "4 / 3", maxWidth: "100%" };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5 shadow-[0_4px_16px_rgba(28,26,25,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg text-foreground">Radna slika</h2>
          <p className="text-sm text-muted-foreground">
            {needsReferenceImage
              ? "Dodajte fotografiju enterijera i 1-5 uglova istog komada nameštaja/dekora. Maska je smernica za poziciju ili komad za zamenu."
              : "Jedna slika po obradi. Advanced maska je opciona."}
          </p>
        </div>
        {currentResult && (
          <Button
            type="button"
            variant={
              baseInput?.storagePath === currentResult.storagePath
                ? "accent"
                : "outline"
            }
            size="sm"
            onClick={() => onUseCurrentResult(currentResult)}
          >
            Koristi rezultat kao sliku za obradu
          </Button>
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
        <input
          ref={referenceFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) onReferenceUpload(files);
            event.currentTarget.value = "";
          }}
        />
      </div>

      {needsReferenceImage && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/50 p-2">
          <div className="grid grid-cols-2 rounded-lg bg-card/50 p-1">
            {(
              [
                ["insert", "Dodaj komad"],
                ["replace", "Zameni postojeći"],
              ] as const
            ).map(([modeId, label]) => (
              <button
                key={modeId}
                type="button"
                onClick={() => onObjectModeChange(modeId)}
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                  objectMode === modeId
                    ? "bg-accent text-accent-foreground shadow-[0_8px_24px_-12px_rgba(184,131,99,0.45)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="min-w-[220px] flex-1 text-xs text-muted-foreground">
            {objectMode === "replace"
              ? "Advanced maska je obavezna: označite postojeći komad koji menjamo. Maska ne mora biti savršena."
              : "Maska je poželjna za preciznu poziciju. Bez maske AI sam bira mesto i rezultat može biti manje predvidljiv."}
          </p>
        </div>
      )}

      {mode === "advanced" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-2">
          <ToolButton
            active={tool === "brush"}
            onClick={() => {
              setTool("brush");
              setRectPreview(null);
            }}
            icon={Brush}
            label="Brush"
          />
          <ToolButton
            active={tool === "rect"}
            onClick={() => {
              setTool("rect");
              setBrushPreview(null);
              setRectPreview(null);
            }}
            icon={RectangleHorizontal}
            label="Pravougaonik"
          />
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

      <div
        className={cn(
          "mt-4 grid gap-4",
          needsReferenceImage
            ? "xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]"
            : "xl:grid-cols-2",
        )}
      >
        <div
          className={cn(
            "rounded-2xl border border-border/30 bg-muted/30 p-3 transition-colors",
            baseDragOver && "border-accent/60 bg-accent/5",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            if (!pending) setBaseDragOver(true);
          }}
          onDragLeave={() => setBaseDragOver(false)}
          onDrop={handleBaseDrop}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
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
                <span className="rounded-full bg-[color:var(--color-sage)]/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-[color:var(--color-sage-deep)]">
                  Iz prethodnog
                </span>
              )}
              {activeImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3 w-3" />
                  Promeni
                </Button>
              )}
            </div>
          </div>
          {activeImage ? (
            <div
              className="relative mx-auto max-w-full touch-none overflow-hidden rounded-xl bg-foreground/5"
              style={{ width: `${Math.min(100 * zoom, 180)}%` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={activeImage.url}
                alt="Radna slika"
                className="block h-auto w-full select-none"
                onLoad={(event) => {
                  setImageFrame({
                    url: activeImage.url,
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  });
                  resetCanvas();
                }}
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
              {mode === "advanced" && tool === "rect" && rectPreview && (
                <span
                  className="pointer-events-none absolute rounded-sm border border-dashed border-white/95 bg-accent/20 shadow-[0_0_0_1px_rgba(184,80,70,0.85),0_0_18px_rgba(184,80,70,0.2)]"
                  style={{
                    left: rectPreview.left,
                    top: rectPreview.top,
                    width: rectPreview.width,
                    height: rectPreview.height,
                  }}
                  aria-hidden="true"
                />
              )}
              {mode === "advanced" && tool === "brush" && brushPreview && (
                <span
                  className="pointer-events-none absolute rounded-full border border-white/90 bg-accent/10 shadow-[0_0_0_1px_rgba(184,80,70,0.75),0_0_18px_rgba(184,80,70,0.25)]"
                  style={{
                    left: brushPreview.x,
                    top: brushPreview.y,
                    width: brushPreview.radius * 2,
                    height: brushPreview.radius * 2,
                    transform: "translate(-50%, -50%)",
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-xl border border-border/40 bg-card/40 text-center transition-colors hover:border-accent/50 hover:bg-card/60"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]">
                <ImageIcon className="h-5 w-5" />
              </span>
              <span className="px-6">
                <span className="block text-base font-semibold text-foreground">
                  Dodajte fotografiju
                </span>
                <span className="mt-1 block max-w-xs text-sm text-muted-foreground">
                  Prevucite fajl ovde ili izaberite JPG, PNG ili WebP do 50MB.
                </span>
              </span>
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-[0_14px_34px_-12px_rgba(159,106,75,0.45)] transition-transform group-hover:translate-y-[-1px]">
                <Upload className="h-3.5 w-3.5" />
                Izaberi fajl
              </span>
            </button>
          )}
        </div>

        {needsReferenceImage && (
          <ReferenceImagesPanel
            references={referenceInputs}
            objectMode={objectMode}
            pending={pending}
            onAdd={() => referenceFileRef.current?.click()}
            onAddFiles={onReferenceUpload}
            onRemove={onReferenceRemove}
            onMakePrimary={onReferenceMakePrimary}
          />
        )}

        <div
          className={cn(
            "rounded-2xl border border-border/30 bg-muted/30 p-3",
            needsReferenceImage && "xl:col-span-2",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Rezultat
              </p>
              {currentResult?.fileName && resultUrl && !processingLabel && (
                <p className="mt-0.5 truncate font-mono text-[0.68rem] text-foreground/60">
                  {currentResult.fileName}
                </p>
              )}
            </div>
            {resultUrl && currentResult?.generationId && !processingLabel && (
              <a
                href={`/api/ai-studio/generations/${currentResult.generationId}/download`}
                download
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/40 bg-card/60 px-3 text-[0.72rem] font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-card/80"
              >
                <Download className="h-3 w-3" />
                Preuzmi
              </a>
            )}
          </div>
          {processingLabel ? (
            <ProcessingResultPreview
              label={processingLabel}
              style={previewFrameStyle}
            />
          ) : resultUrl ? (
            <div
              className="mx-auto max-h-[620px] w-full overflow-hidden rounded-xl bg-foreground/5"
              style={previewFrameStyle}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="AI rezultat"
                className="block h-full w-full object-contain"
              />
            </div>
          ) : processingError ? (
            <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <span className="px-6">
                <span className="block text-sm font-semibold text-destructive">
                  Obrada nije uspela
                </span>
                <span className="mt-1 block text-xs text-destructive/80">
                  {processingError}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex min-h-[176px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-border/40 bg-card/40 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Wand2 className="h-4 w-4" />
              </span>
              <span className="px-6">
                <span className="block text-sm font-semibold text-foreground">
                  Rezultat će se prikazati ovde
                </span>
                <span className="mt-1 block max-w-xs text-xs text-muted-foreground">
                  Kada pokrenete obradu, ovde se odmah prikazuje status.
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {confirmingClear ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              Obriši radnu sliku, rezultat i podešavanja?
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onClearAll();
                setConfirmingClear(false);
              }}
            >
              Da, obriši
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingClear(false)}
            >
              Otkaži
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmingClear(true)}
            disabled={pending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Resetuj sve
          </Button>
        )}
        <div className="flex items-center gap-3">
          <CostPreviewLabel editType={editType} preview={costPreview} />
          <Button
            type="button"
            variant="accent"
            size="lg"
            data-ai-generate-button
            disabled={
              !readiness.canGenerate
            }
            onClick={async () => onGenerate(await exportMask())}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Pokrećemo…
              </>
            ) : processingLabel ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Obrada u toku…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generiši
              </>
            )}
          </Button>
        </div>
      </div>
      {readiness.primaryMessage && (
        <p
          className={cn(
            "mt-2 text-right text-xs",
            readiness.tone === "blocked"
              ? "text-destructive"
              : readiness.tone === "warning"
                ? "text-[color:var(--color-ember-deep)]"
                : "text-muted-foreground",
          )}
        >
          {readiness.primaryMessage}
        </p>
      )}
    </div>
  );
}

function ProcessingResultPreview({
  label,
  style,
}: {
  label: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className="relative mx-auto flex max-h-[620px] min-h-[220px] w-full overflow-hidden rounded-xl border border-accent/30 bg-card/50 text-center"
      style={style}
    >
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(184,131,99,0.16)_38%,transparent_76%)] animate-[ai-result-scan_2.2s_ease-in-out_infinite]" />
      <div className="absolute inset-x-6 top-1/2 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent" />
      <div className="relative z-10 m-auto flex flex-col items-center gap-3 px-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
        <span>
          <span className="block text-base font-semibold text-foreground">
            {label}
          </span>
          <span className="mt-1 block max-w-xs text-sm text-muted-foreground">
            Originalni kadar ostaje osnova; rezultat će se pojaviti čim AI obrada završi.
          </span>
        </span>
      </div>
    </div>
  );
}

function ReferenceImagesPanel({
  references,
  objectMode,
  pending,
  onAdd,
  onAddFiles,
  onRemove,
  onMakePrimary,
}: {
  references: UploadedInput[];
  objectMode: ObjectEditMode;
  pending: boolean;
  onAdd: () => void;
  onAddFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  onMakePrimary: (index: number) => void;
}) {
  const busy = pending;
  const canAdd = references.length < MAX_OBJECT_REFERENCE_IMAGES;
  const [dragOver, setDragOver] = useState(false);
  const hasMultipleReferences = references.length > 1;

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (busy) return;
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) onAddFiles(files);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/30 bg-muted/30 p-3 transition-colors",
        dragOver && "border-accent/60 bg-accent/5",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!busy) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Nameštaj/dekor / uglovi
          </p>
          <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
            {references.length}/{MAX_OBJECT_REFERENCE_IMAGES} slika
          </p>
        </div>
        {canAdd && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onAdd}
            disabled={busy}
          >
            <Plus className="h-3 w-3" />
            Dodaj ugao
          </Button>
        )}
      </div>

      {references.length > 0 && (
        <div
          className={cn(
            "mb-3 rounded-xl border px-3 py-2 text-xs",
            hasMultipleReferences
              ? "border-amber-300/50 bg-amber-50 text-amber-950"
              : "border-border/40 bg-card/60 text-muted-foreground",
          )}
        >
          <p className="font-semibold">
            {hasMultipleReferences
              ? "Više uglova mora biti potpuno isti komad"
              : objectMode === "replace"
                ? "Referenca ide direktno u zamenu"
                : "Referenca ide direktno u dodavanje"}
          </p>
          <p className="mt-0.5 leading-relaxed">
            {hasMultipleReferences
              ? "Dodatne slike moraju prikazivati isti model, istu boju i isti materijal. Različiti komadi kvare rezultat, a AI treba da prati prvu sliku kao glavnu."
              : "Ako slika ima pozadinu ili više predmeta, AI pokušava da koristi najveći, centralni ili najfokusiraniji komad nameštaja/dekora i ignoriše ostatak."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-1 2xl:grid-cols-2">
        {references.map((reference, index) => (
          <div
            key={reference.storagePath}
            className="relative overflow-hidden rounded-xl border border-border/40 bg-card/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reference.url}
              alt={index === 0 ? "Primarna slika komada" : `Ugao komada ${index + 1}`}
              className="aspect-square w-full object-contain"
              draggable={false}
            />
            <div className="absolute left-1.5 top-1.5 rounded-full bg-card/90 px-2 py-0.5 text-[0.62rem] font-semibold text-foreground shadow-sm">
              {index === 0 ? "Primarna" : `Ugao ${index + 1}`}
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={busy}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/75 text-background transition-colors hover:bg-destructive disabled:opacity-50"
              aria-label={`Ukloni sliku komada ${index + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="truncate px-2 py-1.5 font-mono text-[0.62rem] text-muted-foreground">
              {reference.fileName}
            </p>
            {index > 0 && (
              <div className="px-2 pb-2">
                <button
                  type="button"
                  onClick={() => onMakePrimary(index)}
                  disabled={busy}
                  className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-md border border-border/40 bg-background/70 px-2 text-[0.62rem] font-semibold text-foreground transition-colors hover:border-accent/40 disabled:opacity-50"
                >
                  <Star className="h-3 w-3" />
                  Postavi kao glavnu
                </button>
              </div>
            )}
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            disabled={busy}
            className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 bg-card/40 p-3 text-center transition-colors hover:border-accent/50 hover:bg-card/60 disabled:opacity-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Upload className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold text-foreground">
              {references.length === 0 ? "Dodajte komad" : "Dodaj ugao"}
            </span>
          </button>
        )}
      </div>

      <p className="mt-3 text-[0.68rem] leading-relaxed text-muted-foreground">
        Podržani su nameštaj, dekor, rasveta, uređaji, biljke i umetnost. Torbe,
        odeća, ruke, ljudi i sitni lični predmeti nisu namenjeni ovom flow-u.
      </p>
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
  highlightedId,
  deletingId,
  onOpen,
  onUseResult,
  onDelete,
}: {
  history: GenerationHistoryItem[];
  highlightedId: string | null;
  deletingId: string | null;
  onOpen: (item: GenerationHistoryItem) => void;
  onUseResult: (item: GenerationHistoryItem) => void;
  onDelete: (item: GenerationHistoryItem) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const firstId = history[0]?.id ?? null;

  useEffect(() => {
    if (!firstId) return;
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [firstId]);

  return (
    <aside className="rounded-2xl border border-border/40 bg-card/60 p-4 shadow-[0_4px_16px_rgba(28,26,25,0.03)] xl:sticky xl:top-8 xl:flex xl:h-[calc(100vh-7rem)] xl:min-h-[calc(100vh-7rem)] xl:flex-col">
      <div className="mb-4" data-ai-history-dropzone>
        <h2 className="font-heading text-lg text-foreground">Istorija</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Klikni na obradu za detalje. Fajlovi su dostupni 30 dana.
        </p>
        <Link
          href="/portal/ai-creations"
          className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline"
        >
          Prikaži sve AI kreacije
        </Link>
      </div>
      {history.length === 0 ? (
        <EmptyState
          icon={Wand2}
          heading="Bez obrada"
          description="Vaše AI obrade će se pojaviti ovde."
        />
      ) : (
        <div ref={listRef} className="scrollbar-warm min-h-0 space-y-3 overflow-y-auto pr-1 xl:flex-1">
          {history.map((item) => (
            <div
              key={item.id}
              className={cn(
                "overflow-hidden rounded-xl border border-border/40 bg-card/40 transition-colors hover:border-accent/40 hover:bg-card/80",
                highlightedId === item.id && "flash-new border-accent/60 bg-accent/5",
              )}
            >
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="flex w-full items-start gap-3 p-3 text-left"
              >
                {item.resultUrl && !item.filesExpired ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.resultUrl}
                    alt={`AI rezultat: ${getAiEditType(item.editType).label}`}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground">
                    <Eraser className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {getAiEditType(item.editType).label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("sr-RS")} ·{" "}
                    {getAiEngineLabelForGeneration(item.provider, item.model)}
                  </p>
                  {(() => {
                    const ctx = formatHistoryContext(item);
                    return ctx ? (
                      <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">
                        {ctx}
                      </p>
                    ) : null;
                  })()}
                  {item.resultFileName && (
                    <p className="mt-0.5 truncate font-mono text-[0.62rem] text-muted-foreground/70">
                      {item.resultFileName}
                    </p>
                  )}
                  {(item.status === "queued" || item.status === "processing") && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-accent">
                      <Loader2 className="h-3 w-3 animate-spin" />
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
              {(item.resultUrl && !item.filesExpired) ||
              item.status === "completed" ||
              item.status === "failed" ? (
                <div className="flex gap-2 border-t border-border/30 p-3 pt-2">
                  {item.resultUrl && !item.filesExpired && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          onUseResult(item);
                        }}
                      >
                        Koristi kao sliku
                      </Button>
                      <a
                        href={item.downloadUrl ?? `/api/ai-studio/generations/${item.id}/download`}
                        download
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border/40 bg-card/60 px-3 text-[0.8rem] font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-card/80"
                      >
                        <Download className="h-3 w-3" />
                        Preuzmi
                      </a>
                    </>
                  )}
                  {(item.status === "completed" || item.status === "failed") && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(item);
                      }}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Obriši
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function SelectableTile({
  active,
  onClick,
  title,
  subtitle,
  trailing,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
        active
          ? "border-accent bg-accent/10 text-foreground shadow-[0_8px_24px_-12px_rgba(184,131,99,0.35)]"
          : "border-border/40 bg-card/40 text-muted-foreground hover:border-accent/40 hover:text-foreground",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {subtitle && (
          <span
            className={cn(
              "mt-0.5 block text-[0.7rem]",
              active ? "text-foreground/70" : "text-muted-foreground/80",
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
      {trailing}
    </button>
  );
}

function BalanceCard({
  balanceUnits,
  creditsExpireAt,
}: {
  balanceUnits: number;
  creditsExpireAt: string | null;
}) {
  // Snap "now" to mount time so the hint is stable through re-renders
  // and React's purity lint stays happy. Days-left is a hint, not a
  // stopwatch — refreshing the page will resync if it matters.
  const [mountedAt] = useState(() => Date.now());
  const expiresAt = creditsExpireAt ? new Date(creditsExpireAt) : null;
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - mountedAt) / (1000 * 60 * 60 * 24))
    : null;
  const lowBalance = balanceUnits === 0 || (daysLeft !== null && daysLeft <= 14);

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-right shadow-[0_4px_16px_rgba(28,26,25,0.03)]",
        lowBalance
          ? "border-accent/30 bg-accent/5"
          : "border-[color:var(--color-sage)]/25 bg-[color:var(--color-sage)]/5",
      )}
    >
      <div className="flex items-center justify-end gap-2 text-sm font-semibold text-foreground">
        <Coins
          className={cn(
            "h-4 w-4",
            lowBalance ? "text-accent" : "text-[color:var(--color-sage-deep)]",
          )}
        />
        {formatCreditsFromUnits(balanceUnits)}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {expiresAt
          ? `Dostupno do ${expiresAt.toLocaleDateString("sr-RS")}`
          : "Krediti nisu aktivni"}
      </p>
      <Link
        href="/portal/ai-studio/credits"
        className={cn(
          "mt-2 inline-flex text-xs font-semibold hover:underline",
          lowBalance
            ? "text-accent"
            : "text-[color:var(--color-sage-deep)]",
        )}
      >
        Dopuni kredite
      </Link>
    </div>
  );
}

// Builds a one-line history context string: style + option label(s)
// when relevant. Returns null when there's nothing meaningful to show
// (e.g. atmospheric edits without a populated option dropdown).
function formatHistoryContext(item: GenerationHistoryItem): string | null {
  const def = getAiEditType(item.editType);
  const parts: string[] = [];
  if (
    def.supportsStyles &&
    item.styleId &&
    item.styleId !== "none"
  ) {
    const styleLabel = AI_STYLE_OPTIONS.find((s) => s.id === item.styleId)?.label;
    if (styleLabel) parts.push(styleLabel);
  }
  const optionLabel = formatSelectedOptionLabels(item.editType, item.selectedOption);
  if (optionLabel) parts.push(optionLabel);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function CostPreviewLabel({
  editType,
  preview,
}: {
  editType: AiEditType;
  preview: { unitsCharged: number; freeAttemptIndex: number | null } | null;
}) {
  const editUnits = getAiEditType(editType).units;
  if (!preview) {
    return (
      <span className="text-xs text-muted-foreground">
        Naplata:{" "}
        <strong className="text-foreground">
          {formatCreditsFromUnits(editUnits)}
        </strong>
      </span>
    );
  }
  if (preview.unitsCharged === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-sage)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--color-sage-deep)]">
        Besplatan pokušaj #{preview.freeAttemptIndex} od {AI_FREE_REGENERATIONS}
      </span>
    );
  }
  if (preview.freeAttemptIndex !== null) {
    return (
      <span className="text-xs text-muted-foreground">
        Doplata{" "}
        <strong className="text-foreground">
          {formatCreditsFromUnits(preview.unitsCharged)}
        </strong>{" "}
        · besplatan #{preview.freeAttemptIndex}
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      Naplata:{" "}
      <strong className="text-foreground">
        {formatCreditsFromUnits(preview.unitsCharged)}
      </strong>
    </span>
  );
}

// Surfaces the retry state above the studio form. Reading the cost
// preview alone is easy to miss when scrolling — this banner is the
// loud version: "free retry is on" vs "you changed something that
// killed it." Dismissable so a user who started a retry but wants a
// fresh paid edit can clear the link in one click.
function RetryStatusBanner({
  history,
  parentGenerationId,
  linkedParentGenerationId,
  editType,
  onCancel,
}: {
  history: GenerationHistoryItem[];
  parentGenerationId: string | null;
  linkedParentGenerationId: string | null;
  editType: AiEditType;
  onCancel: () => void;
}) {
  if (!parentGenerationId) return null;
  const parent = history.find((item) => item.id === parentGenerationId);
  if (!parent) return null;

  const isFree = linkedParentGenerationId === parentGenerationId;
  const editTypeChanged = parent.editType !== editType;
  const parentLabel = getAiEditType(parent.editType).label;

  if (isFree) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[color:var(--color-sage)]/35 bg-[color:var(--color-sage)]/10 px-4 py-3 text-sm">
        <span className="mt-0.5 inline-flex h-5 items-center rounded-full bg-[color:var(--color-sage)]/20 px-2 text-[0.62rem] font-semibold uppercase tracking-wider text-[color:var(--color-sage-deep)]">
          Besplatno
        </span>
        <div className="flex-1 text-foreground/85">
          {`Aktivno je besplatno ponavljanje obrade „${parentLabel}". Slika, prompt i sva ostala podešavanja smeju da se menjaju — promenom `}
          <strong className="px-0.5">tipa obrade</strong>
          {" gubi se besplatno ponavljanje."}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Otkaži
        </button>
      </div>
    );
  }

  const message = editTypeChanged
    ? `Promenili ste tip obrade — besplatno ponavljanje važi samo za „${parentLabel}". Pokretanje će se naplatiti.`
    : `Besplatno ponavljanje za „${parentLabel}" je iskorišćeno. Sledeća obrada će se naplatiti.`;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-50/60 px-4 py-3 text-sm dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="flex-1 text-foreground/85">{message}</div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        Otkaži
      </button>
    </div>
  );
}

function buildAiStudioReadiness({
  activeInput,
  needsReferenceImage,
  referenceCount,
  editType,
  objectMode,
  maskDirty,
  activeEdit,
  selectedOption,
  balanceUnits,
  linkedParentGenerationId,
  pending,
  processing,
}: {
  activeInput: UploadedInput | null;
  needsReferenceImage: boolean;
  referenceCount: number;
  editType: AiEditType;
  objectMode: ObjectEditMode;
  maskDirty: boolean;
  activeEdit: ReturnType<typeof getAiEditType>;
  selectedOption: string;
  balanceUnits: number;
  linkedParentGenerationId: string | null;
  pending: boolean;
  processing: boolean;
}): StudioReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!activeInput) {
    blockers.push("Dodajte fotografiju za obradu.");
  }
  if (needsReferenceImage && referenceCount === 0) {
    blockers.push("Dodajte bar jednu sliku nameštaja/dekora.");
  }
  if (editType === "object_insertion" && objectMode === "replace" && !maskDirty) {
    blockers.push("Označite maskom postojeći komad koji menjamo.");
  }
  if (
    activeEdit.multiSelect &&
    parseSelectedOptions(selectedOption).length === 0
  ) {
    blockers.push(`Izaberite barem jednu kategoriju u "${activeEdit.optionsLabel ?? "opcije"}".`);
  }
  if (!linkedParentGenerationId && balanceUnits < activeEdit.units) {
    blockers.push("Dopunite AI kredite pre generisanja.");
  }

  if (
    editType === "object_insertion" &&
    objectMode === "insert" &&
    activeInput &&
    referenceCount > 0 &&
    !maskDirty
  ) {
    warnings.push(
      "Maska nije obavezna, ali bez nje AI sam bira poziciju i rezultat može biti manje predvidljiv.",
    );
  }
  if (editType === "object_insertion" && referenceCount > 1) {
    warnings.push(
      "Dodatni uglovi moraju biti isti model, boja i materijal; različiti komadi kvare rezultat, a AI prati prvu sliku.",
    );
  }

  const tone: StudioReadiness["tone"] = pending || processing
    ? "processing"
    : blockers.length > 0
      ? "blocked"
      : warnings.length > 0
        ? "warning"
        : "ready";
  const primaryMessage = pending
    ? "Pokrećemo obradu…"
    : processing
      ? "Obrada je u toku…"
      : blockers[0] ?? warnings[0] ?? null;

  return {
    canGenerate: blockers.length === 0 && !pending && !processing,
    blockers,
    warnings,
    buttonLabel: pending
      ? "Pokrećemo…"
      : processing
        ? "Obrada u toku…"
        : "Generiši",
    primaryMessage,
    tone,
  };
}

function toggleOptionId(current: string, id: string): string {
  const ids = parseSelectedOptions(current);
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  return next.join(",");
}

function isAiEditTypeId(value: string | null): value is AiEditType {
  return Boolean(value && AI_EDIT_TYPES.some((item) => item.id === value));
}

// Mirrors the server-side cost calc in startAiStudioGeneration (which
// is the source of truth) so the customer sees the expected charge —
// free, partial, or full credit — before clicking Generate. Returns
// null when there's no parent linkage; falls back to editDef.units in
// that case at the call site.
function computeCostPreview(
  history: GenerationHistoryItem[],
  parentGenerationId: string | null,
  editType: AiEditType,
): { unitsCharged: number; freeAttemptIndex: number | null } | null {
  if (!parentGenerationId) return null;
  const parent = history.find((item) => item.id === parentGenerationId);
  if (!parent || parent.status !== "completed") return null;
  const paidId = parent.paidGenerationId ?? parent.id;
  const root = history.find((item) => item.id === paidId);
  if (!root) return null;

  const freeUsed = history.filter(
    (item) =>
      item.paidGenerationId === paidId && item.freeAttemptIndex !== null,
  ).length;
  const editUnits = getAiEditType(editType).units;

  if (freeUsed < AI_FREE_REGENERATIONS) {
    if (editUnits <= root.coveredUnits) {
      return { unitsCharged: 0, freeAttemptIndex: freeUsed + 1 };
    }
    return {
      unitsCharged: editUnits - root.coveredUnits,
      freeAttemptIndex: freeUsed + 1,
    };
  }
  return { unitsCharged: editUnits, freeAttemptIndex: null };
}

async function uploadAiFile(file: File, purpose: "input" | "mask" | "reference") {
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

function validateAiImageFile(file: File): string | null {
  if (!AI_UPLOAD_MIME_TYPES.includes(file.type)) {
    return "Dozvoljeni su JPG, PNG i WebP fajlovi.";
  }
  if (file.size > MAX_AI_UPLOAD_BYTES) {
    return "Fajl je prevelik (max 50MB).";
  }
  return null;
}
