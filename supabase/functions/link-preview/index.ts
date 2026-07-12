// supabase/functions/link-preview/index.ts
// Fetches remote URL and extracts OpenGraph / basic meta for link preview cards.
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const BLOCKED_HOSTS = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1)/i;
const MAX_BYTES = 512 * 1024; // 512KB cap
const FETCH_TIMEOUT_MS = 6000;

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function pickMeta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    // property or name
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`,
      "i"
    );
    const m = html.match(re);
    if (m?.[1]) return decode(m[1].trim());
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
      "i"
    );
    const m2 = html.match(re2);
    if (m2?.[1]) return decode(m2[1].trim());
  }
  return null;
}

function absolutize(base: string, maybe: string | null): string | null {
  if (!maybe) return null;
  try {
    return new URL(maybe, base).toString();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url).searchParams.get("url");
    if (!url) return errorResponse("Missing url", 400);

    let target: URL;
    try {
      target = new URL(url);
    } catch {
      return errorResponse("Invalid url", 400);
    }
    if (!/^https?:$/.test(target.protocol)) return errorResponse("Blocked protocol", 400);
    if (BLOCKED_HOSTS.test(target.hostname)) return errorResponse("Blocked host", 400);

    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(target.toString(), {
        signal: ac.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LovableLinkPreview/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } finally {
      clearTimeout(to);
    }

    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("html")) {
      return jsonResponse({
        url: target.toString(),
        title: target.hostname,
        description: null,
        image: null,
        siteName: target.hostname,
      });
    }

    // Read up to MAX_BYTES
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (received < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.byteLength;
        }
      }
      try {
        await reader.cancel();
      } catch { /* ignore */ }
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(
      chunks.reduce((acc, c) => {
        const out = new Uint8Array(acc.length + c.length);
        out.set(acc, 0);
        out.set(c, acc.length);
        return out;
      }, new Uint8Array())
    );

    const title =
      pickMeta(html, ["og:title", "twitter:title"]) ??
      (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? target.hostname);
    const description = pickMeta(html, [
      "og:description",
      "twitter:description",
      "description",
    ]);
    const image = absolutize(
      target.toString(),
      pickMeta(html, ["og:image", "og:image:url", "twitter:image", "twitter:image:src"])
    );
    const siteName = pickMeta(html, ["og:site_name", "application-name"]) ?? target.hostname;

    return new Response(
      JSON.stringify({
        url: target.toString(),
        title: decode(title),
        description,
        image,
        siteName,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          // Cache client + edge for 6h
          "Cache-Control": "public, max-age=21600, s-maxage=21600",
        },
      }
    );
  } catch (e) {
    return errorResponse((e as Error).message ?? "Unknown error", 500);
  }
});
