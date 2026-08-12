// Edge Function: integracoes-dispatcher
// Processa a fila de integrações com retry exponencial, HMAC e idempotência.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BACKOFF_MIN = [1, 5, 30, 120, 480]; // minutos por tentativa

async function hmacSha256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function truncate(s: string | null, max = 8000): string | null {
  if (!s) return s;
  return s.length > max ? s.slice(0, max) + "…[truncated]" : s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({} as { evento_id?: string; limit?: number }));
    const limit = Math.min(Math.max(body.limit ?? 20, 1), 100);

    // 1. Selecionar eventos elegíveis
    let query = supabase
      .from("integracoes_eventos")
      .select("*, integracoes(*)")
      .in("status", ["pendente", "processando"])
      .lte("proxima_tentativa", new Date().toISOString())
      .order("proxima_tentativa", { ascending: true })
      .limit(limit);

    if (body.evento_id) query = supabase.from("integracoes_eventos").select("*, integracoes(*)").eq("id", body.evento_id);

    const { data: eventos, error: qErr } = await query;
    if (qErr) throw qErr;

    const results: Array<Record<string, unknown>> = [];

    for (const ev of eventos ?? []) {
      const integ = (ev as { integracoes: Record<string, unknown> }).integracoes;
      if (!integ || !integ.ativo) {
        await supabase.from("integracoes_eventos").update({
          status: "cancelado", ultimo_erro: "Integração inativa",
        }).eq("id", ev.id);
        continue;
      }

      // Marca processando
      await supabase.from("integracoes_eventos").update({ status: "processando" }).eq("id", ev.id);

      const payloadStr = JSON.stringify(ev.payload ?? {});
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Idempotency-Key": ev.idempotency_key,
        "X-Event-Type": ev.evento_tipo,
        "X-Event-Id": ev.id,
        ...(integ.headers_extra as Record<string, string> ?? {}),
      };

      // HMAC opcional
      const hmacName = integ.hmac_secret_ref as string | null;
      if (hmacName) {
        const secret = Deno.env.get(hmacName);
        if (secret) headers["X-Signature-SHA256"] = await hmacSha256(secret, payloadStr);
      }
      // Bearer opcional
      const bearerName = integ.secret_ref as string | null;
      if (bearerName) {
        const token = Deno.env.get(bearerName);
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const timeoutMs = Number(integ.timeout_ms ?? 15000);
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const inicio = Date.now();
      let respStatus: number | null = null;
      let respBody = "";
      let respHeaders: Record<string, string> = {};
      let erro: string | null = null;

      try {
        const resp = await fetch(integ.endpoint as string, {
          method: "POST",
          headers,
          body: payloadStr,
          signal: controller.signal,
        });
        respStatus = resp.status;
        respBody = await resp.text();
        resp.headers.forEach((v, k) => { respHeaders[k] = v; });
      } catch (e) {
        erro = e instanceof Error ? e.message : String(e);
      } finally {
        clearTimeout(t);
      }

      const duracao = Date.now() - inicio;
      const tentativa = (ev.tentativas ?? 0) + 1;
      const sucesso = respStatus !== null && respStatus >= 200 && respStatus < 300;

      // Log imutável (via service role)
      await supabase.from("integracoes_logs").insert({
        evento_id: ev.id,
        integracao_id: integ.id,
        tentativa,
        request_headers: { ...headers, Authorization: headers.Authorization ? "***" : undefined },
        request_body: truncate(payloadStr),
        response_status: respStatus,
        response_headers: respHeaders,
        response_body: truncate(respBody),
        duracao_ms: duracao,
        erro,
      });

      if (sucesso) {
        await supabase.from("integracoes_eventos").update({
          status: "enviado",
          tentativas: tentativa,
          processado_em: new Date().toISOString(),
          ultimo_erro: null,
        }).eq("id", ev.id);
        results.push({ id: ev.id, ok: true, status: respStatus, duracao });
      } else {
        const maxT = Number(ev.max_tentativas ?? 5);
        if (tentativa >= maxT) {
          await supabase.from("integracoes_eventos").update({
            status: "falhou",
            tentativas: tentativa,
            ultimo_erro: erro ?? `HTTP ${respStatus}: ${respBody.slice(0, 500)}`,
          }).eq("id", ev.id);
        } else {
          const backoffMin = BACKOFF_MIN[Math.min(tentativa - 1, BACKOFF_MIN.length - 1)];
          await supabase.from("integracoes_eventos").update({
            status: "pendente",
            tentativas: tentativa,
            proxima_tentativa: new Date(Date.now() + backoffMin * 60_000).toISOString(),
            ultimo_erro: erro ?? `HTTP ${respStatus}`,
          }).eq("id", ev.id);
        }
        results.push({ id: ev.id, ok: false, status: respStatus, erro, tentativa });
      }
    }

    return new Response(JSON.stringify({ processados: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
