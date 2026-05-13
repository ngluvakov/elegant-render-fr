"use server";

import { revalidatePath } from "next/cache";
import {
  Prisma,
  type AiGeneration,
  type AiGenerationReferenceImage,
} from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { enforceCleanScan } from "@/lib/file-scan";
import {
  AI_FILE_RETENTION_DAYS,
  AI_FREE_REGENERATIONS,
  addDays,
  formatCreditsFromUnits,
  getAiEditType,
  resolveAiImageEngine,
  type AiEditType,
  type AiImageEngineId,
  type AiImageProvider,
} from "@/lib/ai-studio/catalog";
import {
  composeResultFileName,
  slugifyFileName,
} from "@/lib/ai-studio/naming";
import { sanitizeAiStudioError } from "@/lib/ai-studio/errors";
import {
  composeWithMask,
  normalizeInputImage,
  pickProviderTarget,
  prepareInputForProvider,
  prepareMaskForProvider,
  prepareObjectInputForProvider,
  prepareObjectMaskForProvider,
  prepareObjectReferenceForProvider,
  prepareReferenceForProvider,
  resizeToOriginal,
} from "@/lib/ai-studio/image-processing";
import { buildAiEditPrompt } from "@/lib/ai-studio/prompts";
import { validateAiPromptScope } from "@/lib/ai-studio/prompt-scope";
import { generateAiEdit } from "@/lib/ai-studio/providers";
import {
  expireAiCreditsIfNeeded,
  refundAiCreditUnits,
  spendAiCreditUnits,
} from "@/server/actions/ai-credits";

const AI_GENERATION_LOCK_MS = 10 * 60 * 1000;
const AI_GENERATION_MAX_ATTEMPTS = 2;
const AI_STUDIO_MAX_REFERENCE_IMAGES = 5;

type ObjectEditMode = "insert" | "replace";
type StoredReferenceImage = Pick<
  AiGenerationReferenceImage,
  "id" | "sortOrder" | "storagePath" | "mimeType" | "fileName"
>;

export type AiStudioReferenceImageInput = {
  storagePath: string;
  mimeType: string;
  fileName?: string | null;
};

export type AiStudioGenerateInput = {
  editType: AiEditType;
  engineId?: AiImageEngineId | null;
  provider?: AiImageProvider | null;
  inputStoragePath: string;
  inputMimeType: string;
  inputFileName?: string | null;
  referenceImages?: AiStudioReferenceImageInput[] | null;
  referenceStoragePath?: string | null;
  referenceMimeType?: string | null;
  referenceFileName?: string | null;
  maskStoragePath?: string | null;
  maskInverted?: boolean;
  objectMode?: ObjectEditMode | null;
  prompt: string;
  styleId?: string | null;
  selectedOption?: string | null;
  colorHex?: string | null;
  parentGenerationId?: string | null;
};

export type AiGenerationStatusValue =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type SignedAiGeneration = {
  id: string;
  parentGenerationId: string | null;
  paidGenerationId: string | null;
  editType: AiEditType;
  provider: AiImageProvider;
  model: string;
  prompt: string;
  styleId: string | null;
  status: AiGenerationStatusValue;
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
  referenceImages: SignedAiGenerationReferenceImage[];
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
  // Resolved server-side: parent generation's resultFileName, even if
  // the parent isn't in the current 24-row history slice. Lets the
  // detail modal render the breadcrumb without a separate fetch.
  parentResultFileName: string | null;
  selectedOption: string | null;
  colorHex: string | null;
  maskInverted: boolean;
  objectMode: ObjectEditMode;
  hasMask: boolean;
};

export type SignedAiGenerationReferenceImage = {
  id: string;
  sortOrder: number;
  storagePath: string;
  mimeType: string;
  fileName: string | null;
  url: string | null;
  downloadUrl: string | null;
};

export type AiStudioStartResult = {
  error?: string;
  generationId?: string;
  status?: AiGenerationStatusValue;
  balanceUnits?: number;
  unitsCharged?: number;
  freeAttemptIndex?: number | null;
};

export type AiStudioStatusResult = {
  error?: string;
  generation?: SignedAiGeneration;
  balanceUnits?: number;
  balanceLabel?: string;
  creditsExpireAt?: string | null;
};

type GenerationOptions = {
  selectedOption: string | null;
  colorHex: string | null;
  maskInverted: boolean;
  objectMode: ObjectEditMode;
};

export async function getAiStudioState() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Niste prijavljeni." };

  await expireAiCreditsIfNeeded(userId);

  const [user, generations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        aiCreditBalanceUnits: true,
        aiCreditsExpireAt: true,
      },
    }),
    prisma.aiGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  const signedGenerations = await Promise.all(
    generations.map((generation) => signGeneration(generation)),
  );

  return {
    balanceUnits: user?.aiCreditBalanceUnits ?? 0,
    balanceLabel: formatCreditsFromUnits(user?.aiCreditBalanceUnits ?? 0),
    creditsExpireAt: user?.aiCreditsExpireAt?.toISOString() ?? null,
    generations: signedGenerations,
  };
}

export async function startAiStudioGeneration(
  input: AiStudioGenerateInput,
): Promise<AiStudioStartResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Niste prijavljeni." };
  const engine = resolveAiImageEngine({
    engineId: input.engineId,
    provider: input.provider,
  });
  if (!engine?.isActive) {
    return {
      error:
        "Izabrani AI engine nije dostupan za nove obrade. Izaberite jedan od ponuđenih engine-a.",
    };
  }
  const provider = engine.provider;
  const model = engine.model;
  const referenceImages = normalizeReferenceImageInputs(input);
  const objectMode: ObjectEditMode =
    input.editType === "object_insertion" && input.objectMode === "replace"
      ? "replace"
      : "insert";

  if (!ownsAiStudioPath(userId, input.inputStoragePath)) {
    return { error: "Ulazna slika nije dostupna za ovaj nalog." };
  }
  if (referenceImages.length > AI_STUDIO_MAX_REFERENCE_IMAGES) {
    return { error: "Možete dodati najviše 5 slika objekta po obradi." };
  }
  for (const reference of referenceImages) {
    if (!ownsAiStudioPath(userId, reference.storagePath)) {
      return { error: "Slika objekta nije dostupna za ovaj nalog." };
    }
  }
  if (input.maskStoragePath && !ownsAiStudioPath(userId, input.maskStoragePath)) {
    return { error: "Maska nije dostupna za ovaj nalog." };
  }

  const editDef = getAiEditType(input.editType);
  if (editDef.requiresReferenceImage && referenceImages.length === 0) {
    return { error: "Dodajte sliku objekta koji želite da ubacite u enterijer." };
  }
  if (!editDef.requiresReferenceImage && referenceImages.length > 0) {
    return { error: "Referentna slika objekta je dostupna samo za alat za dodavanje objekta." };
  }
  if (objectMode === "replace" && !input.maskStoragePath) {
    return {
      error:
        "Za zamenu označite celu zonu gde novi objekat treba da stane, uključujući senku i kontakt.",
    };
  }

  // ISO 27001 A.8.7. Scan fresh client uploads before passing them to
  // the AI provider. Skip when the input is a derivative — its parent's
  // input was scanned at the root, and our own generated results don't
  // come from outside the system. enforceCleanScan handles delete +
  // audit log on infected/error.
  if (!input.parentGenerationId) {
    const inputScan = await enforceCleanScan({
      storagePath: input.inputStoragePath,
      fileName: input.inputFileName ?? "ai-input",
      fileSize: 0,
      mimeType: "application/octet-stream",
      entityType: "AiStudioInput",
      entityId: userId,
    });
    if (!inputScan.ok) return { error: inputScan.userError };

  }

  if (input.maskStoragePath) {
    const maskScan = await enforceCleanScan({
      storagePath: input.maskStoragePath,
      fileName: "ai-mask",
      fileSize: 0,
      mimeType: "application/octet-stream",
      entityType: "AiStudioInput",
      entityId: userId,
    });
    if (!maskScan.ok) return { error: maskScan.userError };
  }

  for (const reference of referenceImages) {
    const knownReference = await findKnownReferenceImage(userId, reference.storagePath);
    if (!knownReference) {
      const referenceScan = await enforceCleanScan({
        storagePath: reference.storagePath,
        fileName: reference.fileName ?? "ai-reference",
        fileSize: 0,
        mimeType: reference.mimeType,
        entityType: "AiStudioInput",
        entityId: userId,
      });
      if (!referenceScan.ok) return { error: referenceScan.userError };
    }
  }

  const prompt = input.prompt.trim();
  const scopeError = validateAiPromptScope({
    editType: input.editType,
    prompt,
    styleId: input.styleId,
  });
  if (scopeError) return { error: scopeError };

  const now = new Date();
  const expiresAt = addDays(now, AI_FILE_RETENTION_DAYS);
  let unitsToCharge = editDef.units;
  let coveredUnits = editDef.units;
  let paidGenerationId: string | null = null;
  let freeAttemptIndex: number | null = null;
  let rootCoveredUnits: number | null = null;
  // Filename tracking — propagate the root through derivative chains
  // so downloads stay tied to the original upload.
  let rootFileName: string = slugifyFileName(input.inputFileName ?? "slika");
  let inputFileName: string = rootFileName;

  if (input.parentGenerationId) {
    const parent = await prisma.aiGeneration.findFirst({
      where: { id: input.parentGenerationId, userId },
    });
    if (!parent) return { error: "Prethodna obrada nije pronađena." };

    const parentResultIsInput =
      parent.resultStoragePath === input.inputStoragePath;
    const parentInputIsInput = parent.inputStoragePath === input.inputStoragePath;
    const parentMatchesActualInput = parentResultIsInput || parentInputIsInput;

    if (parentMatchesActualInput) {
      if (parent.status !== "completed" || !parent.resultStoragePath) {
        return { error: "Prethodna obrada još nije završena." };
      }

      paidGenerationId = parent.paidGenerationId ?? parent.id;
      const root = await prisma.aiGeneration.findFirst({
        where: { id: paidGenerationId, userId },
      });
      if (!root) return { error: "Početna plaćena obrada nije pronađena." };
      rootCoveredUnits = root.coveredUnits;

      // Inherit the root only when the actual input belongs to the same
      // generation chain. A stale parent id with a fresh upload must not
      // rename the new input or consume the free-retry chain.
      if (parent.rootFileName) rootFileName = parent.rootFileName;
      if (parentResultIsInput && parent.resultFileName) {
        inputFileName = parent.resultFileName;
      }

      const freeUsed = await countFreeAttempts(userId, paidGenerationId);
      if (freeUsed < AI_FREE_REGENERATIONS) {
        if (editDef.units <= rootCoveredUnits) {
          unitsToCharge = 0;
          coveredUnits = rootCoveredUnits;
        } else {
          unitsToCharge = editDef.units - rootCoveredUnits;
          coveredUnits = editDef.units;
        }
        freeAttemptIndex = freeUsed + 1;
      } else {
        paidGenerationId = null;
      }
    }
  }

  // Counter for the result filename: how many generations of THIS edit
  // type already exist on THIS root chain. Padded later via composeResultFileName.
  // Tiny race: two simultaneous create calls can both observe the same
  // count and produce the same filename. Storage path uses the gen id
  // so files don't collide; the duplicate filename is just a UX edge.
  const priorOnRoot = await prisma.aiGeneration.count({
    where: { userId, rootFileName, editType: input.editType },
  });
  const resultFileName = composeResultFileName({
    rootFileName,
    editType: input.editType,
    counter: priorOnRoot + 1,
    date: now,
  });

  const createGeneration = () =>
    prisma.aiGeneration.create({
      data: {
        userId,
        parentGenerationId: input.parentGenerationId ?? null,
        paidGenerationId,
        editType: input.editType,
        provider,
        model,
        prompt,
        styleId: input.styleId || null,
        optionsJson: {
          selectedOption: input.selectedOption ?? null,
          colorHex: input.colorHex ?? null,
          maskInverted: input.maskInverted === true,
          objectMode,
        },
        status: "queued",
        inputStoragePath: input.inputStoragePath,
        inputMimeType: input.inputMimeType,
        referenceStoragePath: referenceImages[0]?.storagePath ?? null,
        referenceMimeType: referenceImages[0]?.mimeType ?? null,
        referenceFileName: referenceImages[0]?.fileName ?? null,
        maskStoragePath: input.maskStoragePath || null,
        referenceImages:
          referenceImages.length > 0
            ? {
                create: referenceImages.map((reference, index) => ({
                  sortOrder: index,
                  storagePath: reference.storagePath,
                  mimeType: reference.mimeType,
                  fileName: reference.fileName ?? null,
                })),
              }
            : undefined,
        rootFileName,
        inputFileName,
        resultFileName,
        unitsCharged: unitsToCharge,
        coveredUnits,
        freeAttemptIndex,
        expiresAt,
      },
    });

  let generation: Awaited<ReturnType<typeof createGeneration>>;
  try {
    generation = await createGeneration();
  } catch (err) {
    const canRetryFreeAttempt =
      input.parentGenerationId &&
      rootCoveredUnits !== null &&
      freeAttemptIndex !== null &&
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002";

    if (!canRetryFreeAttempt) throw err;
    const retryCoveredUnits = rootCoveredUnits;
    if (retryCoveredUnits === null) throw err;
    const freeUsed = paidGenerationId
      ? await countFreeAttempts(userId, paidGenerationId)
      : AI_FREE_REGENERATIONS;

    if (freeUsed < AI_FREE_REGENERATIONS && paidGenerationId) {
      if (editDef.units <= retryCoveredUnits) {
        unitsToCharge = 0;
        coveredUnits = retryCoveredUnits;
      } else {
        unitsToCharge = editDef.units - retryCoveredUnits;
        coveredUnits = editDef.units;
      }
      freeAttemptIndex = freeUsed + 1;
    } else {
      paidGenerationId = null;
      unitsToCharge = editDef.units;
      coveredUnits = editDef.units;
      freeAttemptIndex = null;
    }

    generation = await createGeneration();
  }

  if (!paidGenerationId) {
    paidGenerationId = generation.id;
    await prisma.aiGeneration.update({
      where: { id: generation.id },
      data: { paidGenerationId },
    });
  }

  const spend = await spendAiCreditUnits({
    userId,
    units: unitsToCharge,
    generationId: generation.id,
    note: `AI Studio: ${editDef.label}`,
  });

  if (spend.error) {
    await prisma.aiGeneration.update({
      where: { id: generation.id },
      data: { status: "failed", errorMessage: spend.error, unitsCharged: 0 },
    });
    return { error: spend.error, balanceUnits: spend.balanceAfterUnits };
  }

  revalidatePath("/portal/ai-studio");

  return {
    generationId: generation.id,
    status: "queued",
    balanceUnits: spend.balanceAfterUnits,
    unitsCharged: unitsToCharge,
    freeAttemptIndex,
  };
}

export async function getAiStudioGenerationStatus(
  generationId: string,
): Promise<AiStudioStatusResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Niste prijavljeni." };

  await expireAiCreditsIfNeeded(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isAdmin: true,
      aiCreditBalanceUnits: true,
      aiCreditsExpireAt: true,
    },
  });
  if (!user) return { error: "Korisnik nije pronađen." };

  const generation = await prisma.aiGeneration.findFirst({
    where: {
      id: generationId,
      ...(user.isAdmin ? {} : { userId }),
    },
  });
  if (!generation) return { error: "AI obrada nije pronađena." };

  return {
    generation: await signGeneration(generation),
    balanceUnits: user.aiCreditBalanceUnits,
    balanceLabel: formatCreditsFromUnits(user.aiCreditBalanceUnits),
    creditsExpireAt: user.aiCreditsExpireAt?.toISOString() ?? null,
  };
}

export async function processAiStudioGenerationJob(generationId: string) {
  const claimed = await claimGenerationForProcessing(generationId);
  if (!claimed) {
    await failIfAttemptsExhausted(generationId);
    return;
  }

  try {
    await runGenerationProcessing(claimed);
  } catch (err) {
    const rawMessage =
      err instanceof Error ? err.message : "AI obrada nije uspela.";
    console.error("[AI Studio] Generation failed", {
      generationId: claimed.id,
      provider: claimed.provider,
      model: claimed.model,
      message:
        rawMessage.length > 1500 ? `${rawMessage.slice(0, 1500)}...` : rawMessage,
    });
    await failAiGeneration(claimed, sanitizeAiStudioError(rawMessage));
  }
}

export async function recoverAiStudioGenerationJobs(userId?: string) {
  const now = new Date();
  const stale = await prisma.aiGeneration.findMany({
    where: {
      ...(userId ? { userId } : {}),
      status: { in: ["queued", "processing"] },
      attemptCount: { lt: AI_GENERATION_MAX_ATTEMPTS },
      OR: [
        { status: "queued" },
        { processingLockUntil: null },
        { processingLockUntil: { lt: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 3,
  });

  await Promise.allSettled(
    stale.map((generation) => processAiStudioGenerationJob(generation.id)),
  );
  return stale.length;
}

async function runGenerationProcessing(generation: AiGeneration) {
  const editDef = getAiEditType(generation.editType);
  const options = parseGenerationOptions(generation.optionsJson);
  const referenceRows = await resolveGenerationReferenceImages(generation);

  const [image, references, mask] = await Promise.all([
    downloadStorageFile(generation.inputStoragePath),
    Promise.all(
      referenceRows.map((reference) => downloadStorageFile(reference.storagePath)),
    ),
    generation.maskStoragePath
      ? downloadStorageFile(generation.maskStoragePath)
      : null,
  ]);

  const normalizedInput = await normalizeInputImage(image.buffer);
  const originalDims = normalizedInput.dimensions;
  const target = pickProviderTarget(originalDims, generation.provider);
  const isObjectEdit = generation.editType === "object_insertion";
  const objectInput = isObjectEdit
    ? await prepareObjectInputForProvider(normalizedInput.image)
    : null;
  const preparedImage =
    objectInput?.image ?? (await prepareInputForProvider(normalizedInput.image, target));
  const preparedReferences = await Promise.all(
    references.map(async (reference) => ({
      image: isObjectEdit
        ? await prepareObjectReferenceForProvider(reference.buffer)
        : await prepareReferenceForProvider(reference.buffer, target),
      mimeType: "image/jpeg",
    })),
  );
  const preparedMask = mask
    ? isObjectEdit && objectInput
      ? await prepareObjectMaskForProvider(mask.buffer, {
          width: objectInput.width,
          height: objectInput.height,
        })
      : await prepareMaskForProvider(mask.buffer, target)
    : undefined;

  const fullPrompt = buildAiEditPrompt({
    editType: generation.editType,
    userPrompt: generation.prompt,
    styleId: generation.styleId,
    selectedOption: options.selectedOption,
    colorHex: options.colorHex,
    hasMask: Boolean(mask),
    maskInverted: options.maskInverted,
    objectMode: options.objectMode,
    ratioLabel: isObjectEdit ? undefined : target.ratioLabel,
    hasReferenceImage: references.length > 0,
    referenceImageCount: references.length,
  });

  const output = await generateAiEdit({
    provider: generation.provider,
    model: generation.model,
    prompt: fullPrompt,
    image: preparedImage,
    imageMimeType: "image/jpeg",
    referenceImages: preparedReferences,
    mask: preparedMask,
    maskMimeType: preparedMask ? "image/png" : undefined,
    target: isObjectEdit ? undefined : target,
  });

  const finalImage = mask
    ? await composeWithMask({
        original: normalizedInput.image,
        aiResult: output.image,
        mask: mask.buffer,
        originalDims,
        maskInverted: options.maskInverted,
        softenMask: isObjectEdit,
        expandMask: isObjectEdit,
      })
    : await resizeToOriginal(output.image, originalDims);

  const resultPath = `ai-studio/${generation.userId}/results/${generation.id}.jpg`;
  const { error: uploadError } = await getSupabaseAdmin().storage
    .from("order-files")
    .upload(resultPath, finalImage, {
      contentType: "image/jpeg",
      upsert: true,
    });
  if (uploadError) throw new Error(uploadError.message);

  await prisma.aiGeneration.update({
    where: { id: generation.id },
    data: {
      status: "completed",
      provider: output.provider,
      model: output.model,
      resultStoragePath: resultPath,
      resultMimeType: "image/jpeg",
      providerResponseId: output.providerResponseId ?? null,
      processingLockUntil: null,
      errorMessage: null,
      completedAt: new Date(),
    },
  });

  if (
    generation.parentGenerationId &&
    generation.paidGenerationId &&
    generation.coveredUnits > editDef.units - generation.unitsCharged
  ) {
    await prisma.aiGeneration.updateMany({
      where: { id: generation.paidGenerationId, userId: generation.userId },
      data: { coveredUnits: generation.coveredUnits },
    });
  }

  revalidatePath("/portal/ai-studio");
}

async function claimGenerationForProcessing(generationId: string) {
  const now = new Date();
  const lockUntil = new Date(now.getTime() + AI_GENERATION_LOCK_MS);

  const result = await prisma.aiGeneration.updateMany({
    where: {
      id: generationId,
      status: { in: ["queued", "processing"] },
      attemptCount: { lt: AI_GENERATION_MAX_ATTEMPTS },
      OR: [
        { status: "queued" },
        { processingLockUntil: null },
        { processingLockUntil: { lt: now } },
      ],
    },
    data: {
      status: "processing",
      startedAt: now,
      processingLockUntil: lockUntil,
      attemptCount: { increment: 1 },
    },
  });

  if (result.count === 0) return null;
  return prisma.aiGeneration.findUniqueOrThrow({ where: { id: generationId } });
}

async function failIfAttemptsExhausted(generationId: string) {
  const now = new Date();
  const generation = await prisma.aiGeneration.findUnique({
    where: { id: generationId },
  });
  if (
    !generation ||
    generation.status === "completed" ||
    generation.status === "failed" ||
    generation.attemptCount < AI_GENERATION_MAX_ATTEMPTS ||
    (generation.processingLockUntil && generation.processingLockUntil > now)
  ) {
    return;
  }

  await failAiGeneration(
    generation,
    "AI obrada nije uspela posle više pokušaja. Kredit je vraćen.",
  );
}

async function failAiGeneration(generation: AiGeneration, message: string) {
  const result = await prisma.aiGeneration.updateMany({
    where: {
      id: generation.id,
      status: { in: ["queued", "processing"] },
    },
    data: {
      status: "failed",
      errorMessage: message,
      processingLockUntil: null,
      ...(generation.unitsCharged > 0 ? { unitsCharged: 0 } : {}),
    },
  });
  if (result.count === 0) return;

  if (generation.unitsCharged > 0) {
    await refundAiCreditUnits({
      userId: generation.userId,
      units: generation.unitsCharged,
      generationId: generation.id,
      note: `AI Studio refund: ${getAiEditType(generation.editType).label}`,
    });
  }

  revalidatePath("/portal/ai-studio");
}

async function resolveGenerationReferenceImages(
  generation: AiGeneration,
): Promise<StoredReferenceImage[]> {
  const rows = await prisma.aiGenerationReferenceImage.findMany({
    where: { generationId: generation.id },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      sortOrder: true,
      storagePath: true,
      mimeType: true,
      fileName: true,
    },
  });
  if (rows.length > 0) return rows;
  if (!generation.referenceStoragePath) return [];
  return [
    {
      id: "legacy-primary",
      sortOrder: 0,
      storagePath: generation.referenceStoragePath,
      mimeType: generation.referenceMimeType ?? "image/jpeg",
      fileName: generation.referenceFileName,
    },
  ];
}

async function signReferenceImages(
  generation: AiGeneration,
  isFileActive: boolean,
): Promise<SignedAiGenerationReferenceImage[]> {
  const references = await resolveGenerationReferenceImages(generation);
  return Promise.all(
    references.map(async (reference) => {
      let url: string | null = null;
      if (isFileActive) {
        const { data } = await getSupabaseAdmin().storage
          .from("order-files")
          .createSignedUrl(reference.storagePath, 60 * 30);
        url = data?.signedUrl ?? null;
      }
      return {
        ...reference,
        url,
        downloadUrl: isFileActive
          ? reference.id === "legacy-primary"
            ? `/api/ai-studio/generations/${generation.id}/download/reference`
            : `/api/ai-studio/generations/${generation.id}/download/reference/${reference.id}`
          : null,
      };
    }),
  );
}

async function signGeneration(
  generation: AiGeneration,
): Promise<SignedAiGeneration> {
  const isFileActive = generation.expiresAt > new Date();
  let resultUrl: string | null = null;
  let inputUrl: string | null = null;
  let referenceUrl: string | null = null;

  if (isFileActive && generation.resultStoragePath) {
    const { data } = await getSupabaseAdmin().storage
      .from("order-files")
      .createSignedUrl(generation.resultStoragePath, 60 * 30);
    resultUrl = data?.signedUrl ?? null;
  }

  if (isFileActive && generation.inputStoragePath) {
    const { data } = await getSupabaseAdmin().storage
      .from("order-files")
      .createSignedUrl(generation.inputStoragePath, 60 * 30);
    inputUrl = data?.signedUrl ?? null;
  }

  const referenceImages = await signReferenceImages(generation, isFileActive);
  referenceUrl = referenceImages[0]?.url ?? null;

  // Resolve parent's resultFileName (for breadcrumb in the modal).
  // Cheap single-row lookup; could be batched in signGenerations if
  // it ever shows on a hot path. Same userId guard as elsewhere.
  let parentResultFileName: string | null = null;
  if (generation.parentGenerationId) {
    const parent = await prisma.aiGeneration.findFirst({
      where: { id: generation.parentGenerationId, userId: generation.userId },
      select: { resultFileName: true },
    });
    parentResultFileName = parent?.resultFileName ?? null;
  }

  const options = parseGenerationOptions(generation.optionsJson);

  return {
    id: generation.id,
    parentGenerationId: generation.parentGenerationId,
    paidGenerationId: generation.paidGenerationId,
    editType: generation.editType,
    provider: generation.provider,
    model: generation.model,
    prompt: generation.prompt,
    styleId: generation.styleId,
    status: generation.status as AiGenerationStatusValue,
    unitsCharged: generation.unitsCharged,
    coveredUnits: generation.coveredUnits,
    freeAttemptIndex: generation.freeAttemptIndex,
    errorMessage: sanitizeAiStudioError(generation.errorMessage),
    createdAt: generation.createdAt.toISOString(),
    updatedAt: generation.updatedAt.toISOString(),
    startedAt: generation.startedAt?.toISOString() ?? null,
    completedAt: generation.completedAt?.toISOString() ?? null,
    expiresAt: generation.expiresAt.toISOString(),
    inputStoragePath: generation.inputStoragePath,
    inputMimeType: generation.inputMimeType,
    referenceStoragePath: generation.referenceStoragePath,
    referenceMimeType: generation.referenceMimeType,
    referenceFileName: generation.referenceFileName,
    referenceImages,
    resultStoragePath: generation.resultStoragePath,
    resultMimeType: generation.resultMimeType,
    resultUrl,
    inputUrl,
    referenceUrl,
    downloadUrl:
      isFileActive && generation.resultStoragePath
        ? `/api/ai-studio/generations/${generation.id}/download`
        : null,
    inputDownloadUrl: isFileActive
      ? `/api/ai-studio/generations/${generation.id}/download/input`
      : null,
    referenceDownloadUrl:
      referenceImages[0]?.downloadUrl ??
      (isFileActive && generation.referenceStoragePath
        ? `/api/ai-studio/generations/${generation.id}/download/reference`
        : null),
    filesExpired: !isFileActive,
    rootFileName: generation.rootFileName,
    inputFileName: generation.inputFileName,
    resultFileName: generation.resultFileName,
    parentResultFileName,
    selectedOption: options.selectedOption,
    colorHex: options.colorHex,
    maskInverted: options.maskInverted,
    objectMode: options.objectMode,
    hasMask: Boolean(generation.maskStoragePath),
  };
}

async function countFreeAttempts(userId: string, paidGenerationId: string) {
  return prisma.aiGeneration.count({
    where: {
      userId,
      paidGenerationId,
      freeAttemptIndex: { not: null },
    },
  });
}

function parseGenerationOptions(value: Prisma.JsonValue | null): GenerationOptions {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      selectedOption: null,
      colorHex: null,
      maskInverted: false,
      objectMode: "insert",
    };
  }

  const data = value as Record<string, unknown>;
  return {
    selectedOption:
      typeof data.selectedOption === "string" ? data.selectedOption : null,
    colorHex: typeof data.colorHex === "string" ? data.colorHex : null,
    maskInverted: data.maskInverted === true,
    objectMode: data.objectMode === "replace" ? "replace" : "insert",
  };
}

function normalizeReferenceImageInputs(
  input: AiStudioGenerateInput,
): AiStudioReferenceImageInput[] {
  const fromArray = Array.isArray(input.referenceImages)
    ? input.referenceImages
    : [];
  const references =
    fromArray.length > 0
      ? fromArray
      : input.referenceStoragePath
        ? [
            {
              storagePath: input.referenceStoragePath,
              mimeType: input.referenceMimeType ?? "application/octet-stream",
              fileName: input.referenceFileName ?? null,
            },
          ]
        : [];

  const seen = new Set<string>();
  const normalized: AiStudioReferenceImageInput[] = [];
  for (const reference of references) {
    if (!reference?.storagePath || seen.has(reference.storagePath)) continue;
    seen.add(reference.storagePath);
    normalized.push({
      storagePath: reference.storagePath,
      mimeType: reference.mimeType || "application/octet-stream",
      fileName: reference.fileName ?? null,
    });
  }
  return normalized;
}

async function findKnownReferenceImage(userId: string, storagePath: string) {
  return prisma.aiGeneration.findFirst({
    where: {
      userId,
      OR: [
        { referenceStoragePath: storagePath },
        { referenceImages: { some: { storagePath } } },
      ],
    },
    select: { id: true },
  });
}

function ownsAiStudioPath(userId: string, storagePath: string) {
  return storagePath.startsWith(`ai-studio/${userId}/`);
}

async function downloadStorageFile(storagePath: string) {
  const { data, error } = await getSupabaseAdmin().storage
    .from("order-files")
    .download(storagePath);

  if (error || !data) {
    throw new Error(error?.message ?? "Fajl nije pronađen.");
  }

  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    mimeType: data.type || "image/png",
  };
}
