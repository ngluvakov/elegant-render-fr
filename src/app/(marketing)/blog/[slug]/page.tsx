import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { BlogCard } from "@/components/marketing/blog/blog-card";
import { BlogPostBody } from "@/components/marketing/blog/blog-post-body";
import {
  blogPostKeywords,
  buildBlogPostingJsonLd,
  estimateReadingMinutes,
  formatBlogDate,
  getAllBlogPosts,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/lib/content/blog";
import { buildBreadcrumbJsonLd, createPublicMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  const base = createPublicMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.coverImage,
    imageAlt: post.coverAlt,
    keywords: blogPostKeywords(post),
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedBlogPosts(post);

  return (
    <>
      <JsonLd
        data={[
          buildBlogPostingJsonLd(post),
          buildBreadcrumbJsonLd([
            { name: "Početna", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <article className="mx-auto w-full max-w-3xl px-6 pt-16 md:pt-24">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Nazad na blog
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {post.tags[0] && (
            <span className="rounded-full bg-secondary px-3 py-1 font-medium text-foreground/70">
              {post.tags[0]}
            </span>
          )}
          <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{estimateReadingMinutes(post)} min čitanja</span>
        </div>

        <h1 className="mt-4 text-4xl font-semibold leading-[1.1] text-foreground md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/70">
          {post.excerpt}
        </p>

        <div className="mt-8 border-y border-border/60 py-4 text-sm text-muted-foreground">
          Autor: <span className="text-foreground/80">{post.author}</span>
        </div>

        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border/70 bg-secondary">
          <Image
            src={post.coverImage}
            alt={post.coverAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>

        <div className="mt-10">
          <BlogPostBody blocks={post.body} />
        </div>

        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 border-t border-border/60 pt-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/70 px-3 py-1 text-xs text-foreground/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 py-16">
          <h2 className="text-2xl font-semibold text-foreground">
            Nastavite sa čitanjem
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {related.map((item) => (
              <BlogCard key={item.slug} post={item} />
            ))}
          </div>
        </section>
      )}

      <FinalCta />
    </>
  );
}
