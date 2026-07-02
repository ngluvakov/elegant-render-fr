import type { Metadata } from "next";
import { FinalCta } from "@/components/marketing/final-cta";
import { SectionKicker } from "@/components/brand/section-kicker";
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
  "Saveti, vodiči i uvidi o arhitektonskoj vizuelizaciji — virtuelno opremanje, renderi, 2D i 3D osnove i prodaja nekretnina kroz sliku.";

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
            { name: "Početna", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
          buildBlogItemListJsonLd(posts),
        ]}
      />

      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-20 md:pt-28">
        <SectionKicker>Blog</SectionKicker>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
          Uvidi i saveti iz arhitektonske vizuelizacije
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
          {BLOG_DESCRIPTION}
        </p>
      </div>

      <section className="py-16">
        <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
          {posts.length === 0 ? (
            <p className="text-foreground/60">
              Uskoro objavljujemo prve tekstove.
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
