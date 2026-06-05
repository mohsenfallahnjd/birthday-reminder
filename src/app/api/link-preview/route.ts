import { jsonError, jsonOk } from "@/lib/api";
import type { NextRequest } from "next/server";

export type LinkPreview = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  price: string | null;
  url: string;
};

function getMeta(doc: string, property: string): string | null {
  // og: and twitter: meta tags
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = doc.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function getTitle(doc: string): string | null {
  const og = getMeta(doc, "og:title") ?? getMeta(doc, "twitter:title");
  if (og) return og;
  const m = doc.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? null;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return jsonError("url param required", 400);

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return jsonError("Invalid URL", 400);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return jsonError("Only http/https URLs allowed", 400);
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BirthdayBot/1.0; +https://birthday.app)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en,fa;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return jsonError(`Fetch failed: ${res.status}`, 502);

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return jsonError("Not an HTML page", 422);

    // Only read first 100KB to keep it fast
    const reader = res.body?.getReader();
    if (!reader) return jsonError("No body", 502);
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < 100_000) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
    }
    reader.cancel();
    const html = new TextDecoder().decode(
      chunks.reduce((acc, c) => {
        const merged = new Uint8Array(acc.length + c.length);
        merged.set(acc);
        merged.set(c, acc.length);
        return merged;
      }, new Uint8Array()),
    );

    const title = getTitle(html);
    const description =
      getMeta(html, "og:description") ??
      getMeta(html, "twitter:description") ??
      getMeta(html, "description");
    let image =
      getMeta(html, "og:image") ??
      getMeta(html, "og:image:url") ??
      getMeta(html, "twitter:image") ??
      getMeta(html, "twitter:image:src");

    // Resolve relative image URLs
    if (image && !image.startsWith("http")) {
      try {
        image = new URL(image, parsed.origin).toString();
      } catch {
        image = null;
      }
    }

    const siteName = getMeta(html, "og:site_name");

    // Price: try common patterns
    const price =
      getMeta(html, "product:price:amount") ??
      getMeta(html, "og:price:amount") ??
      getMeta(html, "price") ??
      null;

    const preview: LinkPreview = {
      title: title ? decodeEntities(title) : null,
      description: description ? decodeEntities(description).slice(0, 200) : null,
      image,
      siteName: siteName ? decodeEntities(siteName) : null,
      price,
      url,
    };

    return jsonOk(preview);
  } catch (err) {
    console.error("link-preview error", err);
    return jsonError("Could not fetch page", 502);
  }
}
