// Edge Function: integracoes-test
// Dispara um evento sintético para testar uma integração e retorna a resposta ao vivo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return json({ error: "Não autenticado" }, 401);

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) return json({ error: "Acesso negado" }, 403);

    const { integracao_id, payload } = await req.json();
    if (!integracao_id) return json({ error: "integracao_id obrigatório" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: integ, error } = await admin.from("integracoes").select("*").eq("id", integracao_id).maybeSingle();
    if (error || !integ) return json({ error: "Integração não encontrada" }, 404);

    const testPayload = payload ?? { test: true, timestamp: new Date().toISOString(), user_id: user.user.id };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Test-Request": "true",
      "X-Event-Type": "test.ping",
      ...(integ.headers_extra ?? {}),
    };
    if (integ.secret_ref) {
      const t = Deno.env.get(integ.secret_ref);
      if (t) headers["Authorization"] = `Bearer ${t}`;
    }

    const inicio = Date.now();
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), Number(integ.timeout_ms ?? 15000));
    try {
      const resp = await fetch(integ.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });
      const body = await resp.text();
      const respHeaders: Record<string, string> = {};
      resp.headers.forEach((v, k) => { respHeaders[k] = v; });
      return json({
        ok: resp.ok,
        status: resp.status,
        duracao_ms: Date.now() - inicio,
        response_headers: respHeaders,
        response_body: body.slice(0, 4000),
      });
    } catch (e) {
      return json({
        ok: false,
        duracao_ms: Date.now() - inicio,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      clearTimeout(to);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
