import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Processa digests de notificações devidos.
// Chamado periodicamente por pg_cron (a cada 15 minutos).
// - `horario`: sempre elegível (janela de 1h).
// - `diario`:  elegível apenas quando UTC hour == 11 (~08:00 America/Sao_Paulo).
// - `semanal`: elegível apenas quando UTC hour == 11 e dow == 1 (segunda 08:00 BRT).
// Uma freq específica pode ser forçada via body `{ freq: "diario" }` (útil para admin/teste).

type Freq = "horario" | "diario" | "semanal";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let forcedFreq: Freq | null = null;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.freq && ["horario", "diario", "semanal"].includes(body.freq)) {
        forcedFreq = body.freq as Freq;
      }
    }
  } catch { /* ignore */ }

  const now = new Date();
  const hourUtc = now.getUTCHours();
  const dowUtc = now.getUTCDay(); // 0=domingo

  const freqs: Freq[] = forcedFreq
    ? [forcedFreq]
    : (() => {
        const list: Freq[] = ["horario"];
        if (hourUtc === 11) list.push("diario");
        if (hourUtc === 11 && dowUtc === 1) list.push("semanal");
        return list;
      })();

  const resultado: Record<string, number | string> = { executed_at: now.toISOString() };
  let total = 0;

  for (const freq of freqs) {
    const { data, error } = await supabase.rpc("fn_processar_digests_devidos", { _freq: freq });
    if (error) {
      resultado[`${freq}_erro`] = error.message;
      continue;
    }
    const n = Number(data ?? 0);
    resultado[freq] = n;
    total += n;
  }

  resultado.total_resumos = total;
  resultado.freqs_processadas = freqs.join(",");

  return new Response(JSON.stringify(resultado), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
