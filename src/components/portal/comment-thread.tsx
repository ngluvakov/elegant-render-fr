/**
 * CommentThread — Scrollable message list with 30-second polling for new
 * comments. Distinguishes client vs. admin messages with styled bubbles.
 *
 * Used on: /portal/orders/[orderId] (order detail page).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCommentsAction } from "@/server/actions/comment";
import { EmptyState } from "./empty-state";

type Comment = {
  id: string;
  role: string;
  body: string;
  createdAt: Date;
  author: { name: string | null; email: string } | null;
};

type CommentThreadProps = {
  orderId: string;
  initialComments: Comment[];
  currentUserId: string;
};

export function CommentThread({
  orderId,
  initialComments,
}: CommentThreadProps) {
  const [comments, setComments] = useState(initialComments);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await getCommentsAction(orderId);
      if (fresh.length !== comments.length) {
        setComments(fresh as Comment[]);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [orderId, comments.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  if (comments.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        heading="Aucun message"
        description="Engagez la conversation avec l’équipe via le champ ci-dessous."
      />
    );
  }

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="scrollbar-warm max-h-[480px] space-y-3 overflow-y-auto rounded-lg border border-border/40 bg-card/60 p-4">
      {comments.map((comment) => {
        const isClient = comment.role === "client";
        const authorName = isClient
          ? comment.author?.name ?? "Vous"
          : "Elegant Render";

        return (
          <div
            key={comment.id}
            className={cn(
              "max-w-[85%] rounded-lg px-4 py-3",
              isClient
                ? "ml-auto bg-accent/10 text-right"
                : "mr-auto bg-secondary/60",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[0.72rem] font-semibold uppercase tracking-wider",
                  isClient ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {authorName}
              </span>
              <span className="text-[0.62rem] text-muted-foreground/60">
                {formatTime(comment.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">
              {comment.body}
            </p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
