import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function b64urlEncode(buf: Uint8Array): string {
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function randomChallenge(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return b64urlEncode(arr);
}

async function getUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data } = await client.auth.getUser();
  return data.user;
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, ...body } = await req.json();
    const db = admin();

    // === REGISTRO: gerar opções ===
    if (action === "register-begin") {
      const user = await getUser(req);
      if (!user) return json({ error: "Não autenticado" }, 401);

      const challenge = randomChallenge();
      await db.from("webauthn_challenges").insert({
        user_id: user.id, challenge, purpose: "register",
      });

      // Buscar credenciais existentes para excluir
      const { data: existing } = await db
        .from("webauthn_credentials")
        .select("credential_id, transports")
        .eq("user_id", user.id);

      const userIdBytes = new TextEncoder().encode(user.id);
      return json({
        challenge,
        rp: { name: "Portal do Colaborador" },
        user: {
          id: b64urlEncode(userIdBytes),
          name: user.email ?? user.id,
          displayName: user.email ?? "Colaborador",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          userVerification: "preferred",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
        excludeCredentials: (existing ?? []).map((c) => ({
          type: "public-key",
          id: c.credential_id,
          transports: c.transports ?? [],
        })),
      });
    }

    // === REGISTRO: finalizar ===
    if (action === "register-finish") {
      const user = await getUser(req);
      if (!user) return json({ error: "Não autenticado" }, 401);

      const { credentialId, publicKey, deviceName, transports, challenge } = body;
      if (!credentialId || !publicKey || !challenge) {
        return json({ error: "Payload incompleto" }, 400);
      }

      // Validar challenge
      const { data: ch } = await db
        .from("webauthn_challenges")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .eq("challenge", challenge)
        .eq("purpose", "register")
        .maybeSingle();

      if (!ch) return json({ error: "Desafio inválido" }, 400);
      if (new Date(ch.expires_at) < new Date()) {
        return json({ error: "Desafio expirado" }, 400);
      }

      const { error } = await db.from("webauthn_credentials").insert({
        user_id: user.id,
        credential_id: credentialId,
        public_key: publicKey,
        device_name: deviceName || "Dispositivo",
        transports: transports || [],
      });
      if (error) return json({ error: error.message }, 400);

      await db.from("webauthn_challenges").delete().eq("id", ch.id);
      return json({ success: true });
    }

    // === AUTENTICAÇÃO: gerar desafio (público, sem sessão) ===
    if (action === "auth-begin") {
      const { email } = body;
      let userId: string | null = null;
      let allowCredentials: Array<{ type: string; id: string; transports?: string[] }> = [];

      if (email) {
        // Buscar user_id por email via profiles
        const { data: prof } = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
        userId = prof?.id ?? null;
        if (userId) {
          const { data: creds } = await db
            .from("webauthn_credentials")
            .select("credential_id, transports")
            .eq("user_id", userId);
          allowCredentials = (creds ?? []).map((c) => ({
            type: "public-key", id: c.credential_id, transports: c.transports ?? [],
          }));
        }
      }

      const challenge = randomChallenge();
      await db.from("webauthn_challenges").insert({
        user_id: userId, challenge, purpose: "authenticate",
      });

      return json({
        challenge,
        timeout: 60000,
        userVerification: "preferred",
        allowCredentials,
      });
    }

    // === AUTENTICAÇÃO: finalizar (retorna user_id validado) ===
    if (action === "auth-finish") {
      const { credentialId, challenge } = body;
      if (!credentialId || !challenge) return json({ error: "Payload incompleto" }, 400);

      const { data: cred } = await db
        .from("webauthn_credentials")
        .select("id, user_id, counter")
        .eq("credential_id", credentialId)
        .maybeSingle();

      if (!cred) return json({ error: "Credencial não reconhecida" }, 404);

      const { data: ch } = await db
        .from("webauthn_challenges")
        .select("id, expires_at, user_id")
        .eq("challenge", challenge)
        .eq("purpose", "authenticate")
        .maybeSingle();

      if (!ch) return json({ error: "Desafio inválido" }, 400);
      if (new Date(ch.expires_at) < new Date()) return json({ error: "Desafio expirado" }, 400);

      await db.from("webauthn_credentials")
        .update({ last_used_at: new Date().toISOString(), counter: (cred.counter ?? 0) + 1 })
        .eq("id", cred.id);
      await db.from("webauthn_challenges").delete().eq("id", ch.id);

      // Gerar magic link para logar o usuário
      const { data: userData } = await db.auth.admin.getUserById(cred.user_id);
      if (!userData.user?.email) return json({ error: "Usuário sem email" }, 400);

      const { data: link, error: linkErr } = await db.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email,
      });
      if (linkErr) return json({ error: linkErr.message }, 400);

      return json({
        success: true,
        user_id: cred.user_id,
        email: userData.user.email,
        hashed_token: link.properties?.hashed_token,
        verify_type: "magiclink",
      });
    }

    // === Listar credenciais do usuário ===
    if (action === "list") {
      const user = await getUser(req);
      if (!user) return json({ error: "Não autenticado" }, 401);
      const { data } = await db
        .from("webauthn_credentials")
        .select("id, device_name, created_at, last_used_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return json({ credentials: data ?? [] });
    }

    // === Remover credencial ===
    if (action === "delete") {
      const user = await getUser(req);
      if (!user) return json({ error: "Não autenticado" }, 401);
      const { id } = body;
      if (!id) return json({ error: "ID obrigatório" }, 400);
      const { error } = await db
        .from("webauthn_credentials")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
