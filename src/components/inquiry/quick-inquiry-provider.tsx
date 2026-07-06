"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ProjectInquiryForm,
  type InquiryFormSource,
} from "@/components/inquiry/project-inquiry-form";
import { track } from "@/lib/posthog-events";

type QuickInquiryContextValue = {
  openInquiry: (source?: InquiryFormSource) => void;
};

const QuickInquiryContext = createContext<QuickInquiryContextValue | null>(null);

export function QuickInquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<InquiryFormSource | undefined>();

  const value = useMemo<QuickInquiryContextValue>(
    () => ({
      openInquiry: (nextSource) => {
        track("quick_inquiry_opened", {
          source: nextSource?.source ?? "quick-inquiry",
          ...(nextSource?.sourcePath ? { source_path: nextSource.sourcePath } : {}),
        });
        setSource(nextSource);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <QuickInquiryContext.Provider value={value}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-[min(100vw,36rem)] max-w-[36rem] overflow-y-auto p-0 sm:max-w-[36rem]"
        >
          <SheetHeader className="border-b border-border/50 p-6">
            <SheetTitle className="text-2xl">Quick inquiry</SheetTitle>
            <SheetDescription className="leading-relaxed">
              Send a short description and your materials. We reply with a
              service proposal and an estimate, with no need to go through the
              configurator yourself.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <ProjectInquiryForm
              mode="quick"
              source={source}
              onSubmitted={() => undefined}
            />
          </div>
        </SheetContent>
      </Sheet>
    </QuickInquiryContext.Provider>
  );
}

export function useQuickInquiry() {
  const context = useContext(QuickInquiryContext);
  if (!context) {
    throw new Error("useQuickInquiry must be used inside QuickInquiryProvider");
  }
  return context;
}
