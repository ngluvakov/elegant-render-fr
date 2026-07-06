import type { Metadata } from "next";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { BlogCard } from "@/components/marketing/blog/blog-card";
import {
  buildBlogItemListJsonLd,
  getAllBlogPosts,
} from "@/lib/content/blog";
import { SITE } from "@/lib/content/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

const BLOG_DESCRIPTION =
  "Advice, guides and insights on architectural visualization — virtual staging, renders, 2D and 3D floor plans and selling property through imagery.";

export const metadata: Metadata = createPublicMetadata({
  title: "Blog",
  description: BLOG_DESCRIPTION,
  path: "/blog",
});

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/blog",
            name: `${SITE.name} Blog`,
            description: BLOG_DESCRIPTION,
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
          buildBlogItemListJsonLd(posts),
        ]}
      />

      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-20 md:pt-28">
        <p className="section-kicker">Blog</p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Insights and advice on architectural visualization
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          {BLOG_DESCRIPTION}
        </p>
      </div>

      <section className="py-16">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          {posts.length === 0 ? (
            <p className="text-foreground/60">
              The first articles are coming soon.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      <FinalCta />
    </>
  );
}
