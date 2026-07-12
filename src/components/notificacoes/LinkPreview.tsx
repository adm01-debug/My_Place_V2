import { useEffect, useState } from 'react';
import { ExternalLink, Link as LinkIcon, ImageOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LinkPreviewData {
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string;
}

interface LinkPreviewProps {
  url: string;
}

const CACHE_KEY = 'link_preview_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

type CacheEntry = { at: number; data: LinkPreviewData | null };

function readCache(): Record<string, CacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
}
function writeCache(cache: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota — ignore */
  }
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cache = readCache();
      const cached = cache[url];
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      try {
        const { data: resp, error } = await supabase.functions.invoke('link-preview', {
          body: null,
          method: 'GET',
          // functions.invoke does not append query params — use fetch fallback
        });
        // supabase-js v2 does not support query strings on invoke reliably; call fetch directly
        void resp;
        void error;
      } catch {
        /* ignore — using direct fetch below */
      }

      try {
        const base = (import.meta.env.VITE_SUPABASE_URL as string) ?? '';
        const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ??
          (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? '';
        const endpoint = `${base}/functions/v1/link-preview?url=${encodeURIComponent(url)}`;
        const res = await fetch(endpoint, {
          headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as LinkPreviewData;
        if (cancelled) return;
        setData(json);
        const next = readCache();
        next[url] = { at: Date.now(), data: json };
        writeCache(next);
      } catch {
        if (cancelled) return;
        setData(null);
        const next = readCache();
        next[url] = { at: Date.now(), data: null };
        writeCache(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-2.5 animate-pulse">
        <div className="flex gap-2.5">
          <div className="w-14 h-14 rounded bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 bg-muted rounded" />
            <div className="h-2.5 w-full bg-muted rounded" />
            <div className="h-2.5 w-1/2 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <LinkIcon className="w-3 h-3" />
        <span className="truncate max-w-[240px]">{url}</span>
      </a>
    );
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="mt-2 block rounded-lg border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 transition-all overflow-hidden group"
      aria-label={`Abrir link externo: ${data.title}`}
    >
      <div className="flex gap-2.5 p-2.5">
        {data.image && !imgErr ? (
          <img
            src={data.image}
            alt=""
            loading="lazy"
            onError={() => setImgErr(true)}
            className="w-14 h-14 rounded object-cover flex-shrink-0 bg-muted"
          />
        ) : (
          <div className="w-14 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <ImageOff className="w-5 h-5 text-muted-foreground/60" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground truncate">
            <ExternalLink className="w-2.5 h-2.5" />
            <span className="truncate">{data.siteName}</span>
          </div>
          <div className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {data.title}
          </div>
          {data.description && (
            <div className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
              {data.description}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
