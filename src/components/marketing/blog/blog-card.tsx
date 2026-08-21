/**
 * BlogCard — cover + meta + title/excerpt card used on the blog listing
 * and in the "keep reading" strip on post pages.
 */
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  estimateReadingMinutes,
  formatBlogDate,
  type BlogPost,
} from "@/lib/content/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card transition-[border-color,box-shadow] duration-200 hover:border-[#d4d4d4] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{estimateReadingMinutes(post)} min de lecture</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground/70">
          {post.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
          Lire l’article
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
