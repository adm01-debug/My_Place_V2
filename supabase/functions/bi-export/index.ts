// Edge Function: bi-export
// Gera arquivos XLSX/CSV consolidados a partir das RPCs de BI.
// Segurança: valida JWT + role admin/gestor no banco antes de responder.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Dataset =
  | "headcount"
  | "absenteismo"
  | "custo"
  | "turnover"
  | "engajamento"
  | "compliance";

const RPC_MAP: Record<Dataset, string> = {
  headcount: "fn_bi_headcount",
  absenteismo: "fn_bi_absenteismo",
  custo: "fn_bi_custo",
  turnover: "fn_bi_turnover",
  engajamento: "fn_bi_engajamento",
  compliance: "fn_bi_compliance",
};

interface ExportRequest {
  datasets: Dataset[];
  format?: "xlsx" | "csv";
  meses?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Não autenticado" }, 401);
    }

    const body = (await req.json().catch(() => ({}))) as ExportRequest;
    const datasets: Dataset[] =
      Array.isArray(body.datasets) && body.datasets.length > 0
        ? body.datasets
        : (Object.keys(RPC_MAP) as Dataset[]);
    const format = body.format === "csv" ? "csv" : "xlsx";
    const meses =
      typeof body.meses === "number" && body.meses > 0 && body.meses <= 24
        ? body.meses
        : 12;

    // Autoriza via RPC (retorna false se não for admin/gestor)
    const { data: canView, error: authErr } = await supabase.rpc(
      "fn_bi_pode_ver",
    );
    if (authErr) return json({ error: authErr.message }, 500);
    if (!canView) return json({ error: "Acesso negado" }, 403);

    // Buscar cada dataset via RPC
    const workbook = XLSX.utils.book_new();
    const csvParts: string[] = [];

    for (const ds of datasets) {
      const rpc = RPC_MAP[ds];
      const args =
        ds === "turnover" || ds === "compliance" ? {} : { p_meses: meses };
      const { data, error } = await supabase.rpc(rpc, args);
      if (error) {
        return json({ error: `Falha em ${ds}: ${error.message}` }, 500);
      }
      const rows = Array.isArray(data) ? data : [];

      if (format === "xlsx") {
        const sheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, sheet, ds.slice(0, 31));
      } else {
        csvParts.push(`# ${ds}`);
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]);
          csvParts.push(headers.join(","));
          for (const r of rows) {
            csvParts.push(
              headers
                .map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? ""))
                .join(","),
            );
          }
        }
        csvParts.push("");
      }
    }

    if (format === "xlsx") {
      const buffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      }) as ArrayBuffer;
      return new Response(buffer, {
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="bi-export-${
            new Date().toISOString().slice(0, 10)
          }.xlsx"`,
        },
      });
    }

    return new Response(csvParts.join("\n"), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bi-export-${
          new Date().toISOString().slice(0, 10)
        }.csv"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
