import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://desk.dineezy.com";

  return {
    rules: [
      {
        userAgent: "*",
        // Only allow crawling the root; auth + dashboard are private
        allow: "/",
        disallow: ["/dashboard", "/login", "/signup", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
