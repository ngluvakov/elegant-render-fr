"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  AI_FILE_RETENTION_DAYS,
  AI_FREE_REGENERATIONS,
  addDays,
  formatCreditsFromUnits,
  getAiEditType,
  getAiProviderModel,
  type AiEditType,
  type AiImageProvider,
} from "@/lib/ai-studio/catalog";
import { buildAiEditPrompt } from "@/lib/ai-studio/prompts";
import { generateAiEdit } from "@/lib/ai-studio/providers";
import {
  expireAiCreditsIfNeeded,
  refundAiCreditUnits,
  spendAiCreditUnits,
} from "@/server/actions/ai-credits";

export type AiStudioGenerateInput = {
  editType: AiEditType;
  provider: AiImageProvider;
  inputStoragePath: string;
  inputMimeType: string;
  maskStoragePath?: string | null;
  maskInverted?: boolean;
  prompt: string;
  styleId?: string | null;
  selectedOption?: string | null;
  colorHex?: string | null;
  parentGenerationId?: string | null;
};

export type AiStudioGenerationResult = {
  error?: string;
  generationId?: string;
  resultUrl?: string;
  resultStoragePath?: string;
  resultMimeType?: string;
  balanceUnits?: number;
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

  const now = new Date();
  const signedGenerations = await Promise.all(
    generations.map(async (generation) => {
      const isFileActive = generation.expiresAt > now;
      let resultUrl: string | null = null;
      let inputUrl: string | null = null;

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

      return {
        id: generation.id,
        editType: generation.editType,
        provider: generation.provider,
        model: generation.model,
        prompt: generation.prompt,
        styleId: generation.styleId,
        status: generation.status,
        unitsCharged: generation.unitsCharged,
        freeAttemptIndex: generation.freeAttemptIndex,
        errorMessage: generation.errorMessage,
        createdAt: generation.createdAt.toISOString(),
        expiresAt: generation.expiresAt.toISOString(),
        inputStoragePath: generation.inputStoragePath,
        inputMimeType: generation.inputMimeType,
        resultStoragePath: generation.resultStoragePath,
        resultMimeType: generation.resultMimeType,
        resultUrl,
        inputUrl,
        filesExpired: !isFileActive,
      };
    }),
  );

  return {
    balanceUnits: user?.aiCreditBalanceUnits ?? 0,
    balanceLabel: formatCreditsFromUnits(user?.aiCreditBalanceUnits ?? 0),
    creditsExpireAt: user?.aiCreditsExpireAt?.toISOString() ?? null,
    generations: signedGenerations,
  };
}

export async function generateAiStudioImage(
  input: AiStudioGenerateInput,
): Promise<AiStudioGenerationResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Niste prijavljeni." };

  const editDef = getAiEditType(input.editType);
  const model = getAiProviderModel(input.provider);
  const expiresAt = addDays(new Date(), AI_FILE_RETENTION_DAYS);
  let unitsToCharge = editDef.units;
  let coveredUnits = editDef.units;
  let paidGenerationId: string | null = null;
  let freeAttemptIndex: number | null = null;

  if (input.parentGenerationId) {
    const parent = await prisma.aiGeneration.findFirst({
      where: { id: input.parentGenerationId, userId },
    });
    if (!parent) return { error: "Prethodna obrada nije pronađena." };

    paidGenerationId = parent.paidGenerationId ?? parent.id;
    const root = await prisma.aiGeneration.findFirst({
      where: { id: paidGenerationId, userId },
    });
    if (!root) return { error: "Početna plaćena obrada nije pronađena." };

    const freeUsed = await prisma.aiGeneration.count({
      where: {
        userId,
        paidGenerationId,
        freeAttemptIndex: { not: null },
      },
    });

    if (freeUsed < AI_FREE_REGENERATIONS) {
      if (editDef.units <= root.coveredUnits) {
        unitsToCharge = 0;
        freeAttemptIndex = freeUsed + 1;
      } else {
        unitsToCharge = editDef.units - root.coveredUnits;
        coveredUnits = editDef.units;
        freeAttemptIndex = freeUsed + 1;
      }
    } else {
      paidGenerationId = null;
    }
  }

  const generation = await prisma.aiGeneration.create({
    data: {
      userId,
      parentGenerationId: input.parentGenerationId ?? null,
      paidGenerationId,
      editType: input.editType,
      provider: input.provider,
      model,
      prompt: input.prompt.trim(),
      styleId: input.styleId || null,
      optionsJson: {
        selectedOption: input.selectedOption ?? null,
        colorHex: input.colorHex ?? null,
        maskInverted: input.maskInverted === true,
      },
      inputStoragePath: input.inputStoragePath,
      inputMimeType: input.inputMimeType,
      maskStoragePath: input.maskStoragePath || null,
      unitsCharged: unitsToCharge,
      coveredUnits,
      freeAttemptIndex,
      expiresAt,
    },
  });

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
  const reservedUnits = spend.error ? 0 : unitsToCharge;

  if (spend.error) {
    await prisma.aiGeneration.update({
      where: { id: generation.id },
      data: { status: "failed", errorMessage: spend.error, unitsCharged: 0 },
    });
    return { error: spend.error, balanceUnits: spend.balanceAfterUnits };
  }

  try {
    const [image, mask] = await Promise.all([
      downloadStorageFile(input.inputStoragePath),
      input.maskStoragePath ? downloadStorageFile(input.maskStoragePath) : null,
    ]);

    const fullPrompt = buildAiEditPrompt({
      editType: input.editType,
      userPrompt: input.prompt,
      styleId: input.styleId,
      selectedOption: input.selectedOption,
      colorHex: input.colorHex,
      hasMask: Boolean(mask),
      maskInverted: input.maskInverted === true,
    });

    const output = await generateAiEdit({
      provider: input.provider,
      prompt: fullPrompt,
      image: image.buffer,
      imageMimeType: image.mimeType || input.inputMimeType,
      mask: mask?.buffer,
      maskMimeType: mask?.mimeType,
    });

    const extension = output.mimeType.includes("jpeg") ? "jpg" : "png";
    const resultPath = `ai-studio/${userId}/results/${generation.id}.${extension}`;
    const { error: uploadError } = await getSupabaseAdmin().storage
      .from("order-files")
      .upload(resultPath, output.image, {
        contentType: output.mimeType,
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    await prisma.aiGeneration.update({
      where: { id: generation.id },
      data: {
        status: "completed",
        resultStoragePath: resultPath,
        resultMimeType: output.mimeType,
        providerResponseId: output.providerResponseId ?? null,
        completedAt: new Date(),
      },
    });

    if (input.parentGenerationId && coveredUnits > editDef.units - unitsToCharge) {
      await prisma.aiGeneration.updateMany({
        where: { id: paidGenerationId, userId },
        data: { coveredUnits },
      });
    }

    const { data } = await getSupabaseAdmin().storage
      .from("order-files")
      .createSignedUrl(resultPath, 60 * 30);

    revalidatePath("/portal/ai-studio");

    return {
      generationId: generation.id,
      resultUrl: data?.signedUrl ?? undefined,
      resultStoragePath: resultPath,
      resultMimeType: output.mimeType,
      balanceUnits: spend.balanceAfterUnits,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI obrada nije uspela.";
    const refund =
      reservedUnits > 0
        ? await refundAiCreditUnits({
            userId,
            units: reservedUnits,
            generationId: generation.id,
            note: `AI Studio refund: ${editDef.label}`,
          })
        : null;
    await prisma.aiGeneration.update({
      where: { id: generation.id },
      data: {
        status: "failed",
        errorMessage: message,
        ...(reservedUnits > 0 ? { unitsCharged: 0 } : {}),
      },
    });
    return {
      error: message,
      balanceUnits: refund?.balanceAfterUnits ?? spend.balanceAfterUnits,
    };
  }
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
