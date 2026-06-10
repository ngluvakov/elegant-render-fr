"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { AiEditType } from "@/lib/ai-studio/catalog";

export type AssistantGuidePage =
  | "ai_studio"
  | "order_detail"
  | "pricing"
  | "service"
  | "portfolio"
  | "general";

export type AssistantGuideStage =
  | "before_upload"
  | "after_upload"
  | "ready_to_generate"
  | "has_result"
  | "no_credits"
  | "credit_purchase"
  | "missing_order_data"
  | "order_ready"
  | "pricing_review"
  | "service_detail"
  | "portfolio_reference"
  | "contact";

export type AssistantGuideContext = {
  page: AssistantGuidePage;
  stage?: AssistantGuideStage;
  editType?: AiEditType;
  productIds?: string[];
  unconfiguredCount?: number;
  hasFiles?: boolean;
  hasPrompt?: boolean;
  balanceUnits?: number;
  missingItems?: string[];
  readinessWarnings?: string[];
  canGenerate?: boolean;
  // Cenovnik (/cene) cart awareness — set by PricingAssistantGuideContext so
  // the assistant (bubble tips + AI) can recognize what the user is building.
  cartItemCount?: number;
  cartTotalEur?: number;
  cartOriginalTotalEur?: number;
  cartHasDiscount?: boolean;
};

type Listener = () => void;

let currentContext: AssistantGuideContext | null = null;
let currentContextKey = "null";
let currentOwner: symbol | null = null;
const listeners = new Set<Listener>();

function normalizeContext(
  context: AssistantGuideContext,
): AssistantGuideContext {
  const productIds = context.productIds
    ? Array.from(new Set(context.productIds.filter(Boolean))).sort()
    : undefined;
  const missingItems = context.missingItems
    ? Array.from(new Set(context.missingItems.filter(Boolean)))
    : undefined;
  const readinessWarnings = context.readinessWarnings
    ? Array.from(new Set(context.readinessWarnings.filter(Boolean)))
    : undefined;

  return {
    ...context,
    productIds,
    missingItems,
    readinessWarnings,
  };
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function writeAssistantGuideContext(
  context: AssistantGuideContext,
  owner: symbol | null,
) {
  const nextContext = normalizeContext(context);
  const nextKey = JSON.stringify(nextContext);
  if (currentContextKey === nextKey && currentOwner === owner) return;

  currentContext = nextContext;
  currentContextKey = nextKey;
  currentOwner = owner;
  emitChange();
}

function resetAssistantGuideContext(owner?: symbol) {
  if (owner && currentOwner && currentOwner !== owner) return;
  if (!currentContext && currentContextKey === "null") return;

  currentContext = null;
  currentContextKey = "null";
  currentOwner = null;
  emitChange();
}

export function setAssistantGuideContext(context: AssistantGuideContext) {
  writeAssistantGuideContext(context, null);
}

export function clearAssistantGuideContext() {
  resetAssistantGuideContext();
}

export function useAssistantGuideContext(
  context: AssistantGuideContext | null,
) {
  const ownerRef = useRef<symbol>(Symbol("assistant-guide-context"));
  const contextRef = useRef<AssistantGuideContext | null>(context);
  const contextKey = JSON.stringify(context ?? null);
  contextRef.current = context;

  useEffect(() => {
    const owner = ownerRef.current;
    const nextContext = contextRef.current;
    if (nextContext) {
      writeAssistantGuideContext(nextContext, owner);
    } else {
      resetAssistantGuideContext(owner);
    }

    return () => resetAssistantGuideContext(owner);
  }, [contextKey]);
}

export function useAssistantGuideSnapshot() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentContext,
    () => null,
  );
}
