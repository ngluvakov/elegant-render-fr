import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elegant Render",
    short_name: "Elegant Render",
    description:
      "Arhitektonska vizuelizacija — renderi, virtuelno opremanje, adaptacije prostora",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1ea",
    theme_color: "#b88363",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
