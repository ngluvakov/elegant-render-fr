/**
 * EmptyState — Reusable empty-state placeholder with icon, heading,
 * optional description, and optional action link.
 *
 * Used on: /portal dashboard, /portal/porudzbine, CommentThread, and others.
 */
import type { LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

type EmptyStateProps = {
  icon: LucideIcon;
  heading: string;
  description?: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, heading, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/60 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
        <Icon className="h-5 w-5 text-muted-foreground/60" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{heading}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          <ButtonLink href={action.href} size="sm" variant="accent">
            {action.label}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
