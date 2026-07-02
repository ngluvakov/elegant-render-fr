/**
 * BlogPostBody — renders a post's structured `BlogBlock[]` into styled
 * elements, and exposes `renderInline` for the small inline syntax:
 *   **bold**, *italic* / _italic_, and [label](href).
 *
 * Everything renders to real React nodes (no dangerouslySetInnerHTML), so
 * the inline syntax is safe by construction.
 */
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import type { BlogBlock } from "@/lib/content/blog";
import { cn } from "@/lib/utils";

// One pass over the string, matching (in priority order) links, bold,
// then italics. Bold/italic runs are treated as plain text inside — good
// enough for blog prose and impossible to inject HTML through.
const INLINE_RE =
  /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g;

export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));

    const [full, linkLabel, linkHref, bold, italicStar, italicUnderscore] =
      match;
    const linkClass =
      "font-medium text-accent underline-offset-4 hover:underline";

    if (linkHref && linkLabel) {
      nodes.push(
        linkHref.startsWith("/") ? (
          <Link key={key++} href={linkHref} className={linkClass}>
            {linkLabel}
          </Link>
        ) : (
          <a
            key={key++}
            href={linkHref}
            target="_blank"
            rel="noreferrer noopener"
            className={linkClass}
          >
            {linkLabel}
          </a>
        ),
      );
    } else if (bold) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {bold}
        </strong>,
      );
    } else if (italicStar || italicUnderscore) {
      nodes.push(<em key={key++}>{italicStar || italicUnderscore}</em>);
    }

    lastIndex = index + (full?.length ?? 0);
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function BlogPostBody({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2
                key={i}
                className="mt-12 text-2xl font-semibold leading-tight text-foreground md:text-3xl"
              >
                {renderInline(block.text)}
              </h2>
            ) : (
              <h3
                key={i}
                className="mt-8 text-xl font-semibold leading-tight text-foreground"
              >
                {renderInline(block.text)}
              </h3>
            );

          case "paragraph":
            return (
              <p
                key={i}
                className={cn(
                  "leading-relaxed text-foreground/80",
                  block.lead ? "text-lg md:text-xl" : "text-base",
                )}
              >
                {renderInline(block.text)}
              </p>
            );

          case "list": {
            const items = block.items.map((item, j) => (
              <li key={j} className="leading-relaxed marker:text-accent">
                {renderInline(item)}
              </li>
            ));
            return block.ordered ? (
              <ol
                key={i}
                className="list-decimal space-y-2 pl-5 text-foreground/80"
              >
                {items}
              </ol>
            ) : (
              <ul
                key={i}
                className="list-disc space-y-2 pl-5 text-foreground/80"
              >
                {items}
              </ul>
            );
          }

          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-accent/60 pl-5 text-lg italic leading-relaxed text-foreground/75"
              >
                {renderInline(block.text)}
                {block.cite && (
                  <cite className="mt-2 block text-sm not-italic text-muted-foreground">
                    — {block.cite}
                  </cite>
                )}
              </blockquote>
            );

          case "image":
            return (
              <figure key={i} className="my-8">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border/70 bg-secondary">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          case "table":
            return (
              <div
                key={i}
                className="my-8 overflow-x-auto rounded-2xl border border-border/70"
              >
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/60">
                      {block.headers.map((header, hi) => (
                        <th
                          key={hi}
                          className="px-4 py-3 font-semibold text-foreground"
                        >
                          {renderInline(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-b border-border/40 last:border-0"
                      >
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-4 py-3 align-top text-foreground/80"
                          >
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "cta":
            return (
              <div key={i} className="mt-10">
                <ButtonLink href={block.href} variant="accent">
                  {block.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ButtonLink>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
