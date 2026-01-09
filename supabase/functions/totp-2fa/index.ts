import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base32 encoding/decoding
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Uint8Array): string {
  let result = "";
  let bits = 0;
  let value = 0;
  
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  
  return result;
}

function base32Decode(encoded: string): Uint8Array {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  
  for (const char of cleaned) {
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return new Uint8Array(bytes);
}

// Generate random secret
function generateSecret(length = 20): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

// Generate backup codes
function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// HMAC-SHA1 implementation using Web Crypto API
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = new ArrayBuffer(key.length);
  new Uint8Array(keyBuffer).set(key);
  
  const messageBuffer = new ArrayBuffer(message.length);
  new Uint8Array(messageBuffer).set(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageBuffer);
  return new Uint8Array(signature);
}

// Generate TOTP code
async function generateTOTP(secret: string, timeStep = 30, digits = 6): Promise<string> {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);
  
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setBigUint64(0, BigInt(time), false);
  
  const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
  
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % Math.pow(10, digits);
  
  return code.toString().padStart(digits, "0");
}

// Verify TOTP code with time window
async function verifyTOTP(secret: string, code: string, window = 1): Promise<boolean> {
  for (let i = -window; i <= window; i++) {
    const timeStep = 30;
    const key = base32Decode(secret);
    const time = Math.floor(Date.now() / 1000 / timeStep) + i;
    
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setBigUint64(0, BigInt(time), false);
    
    const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
    
    const offset = hmac[hmac.length - 1] & 0x0f;
    const generatedCode = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;
    
    if (generatedCode.toString().padStart(6, "0") === code) {
      return true;
    }
  }
  return false;
}

// Generate QR code URL for Google Authenticator
function generateOTPAuthURL(secret: string, email: string, issuer = "PortalColaborador"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string;

    const { action, code, backupCode } = await req.json();

    console.log(`2FA action: ${action} for user: ${userId}`);

    switch (action) {
      case "setup": {
        // Check if already has 2FA
        const { data: existing } = await supabase
          .from("user_2fa")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (existing?.enabled) {
          return new Response(
            JSON.stringify({ error: "2FA já está ativado" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const secret = generateSecret();
        const backupCodes = generateBackupCodes();
        const otpauthUrl = generateOTPAuthURL(secret, userEmail);

        // Upsert 2FA record (not enabled yet)
        const { error: upsertError } = await supabase
          .from("user_2fa")
          .upsert({
            user_id: userId,
            secret,
            backup_codes: backupCodes,
            enabled: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (upsertError) {
          console.error("Error setting up 2FA:", upsertError);
          return new Response(
            JSON.stringify({ error: "Erro ao configurar 2FA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            secret,
            otpauthUrl,
            backupCodes,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify-setup": {
        // Verify the code during setup to enable 2FA
        const { data: settings } = await supabase
          .from("user_2fa")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!settings) {
          return new Response(
            JSON.stringify({ error: "Configure o 2FA primeiro" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (settings.enabled) {
          return new Response(
            JSON.stringify({ error: "2FA já está ativado" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(settings.secret, code);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Código inválido", valid: false }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Enable 2FA
        const { error: updateError } = await supabase
          .from("user_2fa")
          .update({
            enabled: true,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error enabling 2FA:", updateError);
          return new Response(
            JSON.stringify({ error: "Erro ao ativar 2FA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, valid: true, message: "2FA ativado com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify": {
        // Verify TOTP code during login
        const { data: settings } = await supabase
          .from("user_2fa")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!settings?.enabled) {
          return new Response(
            JSON.stringify({ error: "2FA não está ativado", valid: false }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if it's a backup code
        if (backupCode) {
          const upperCode = backupCode.toUpperCase();
          if (settings.backup_codes?.includes(upperCode)) {
            // Remove used backup code
            const newCodes = settings.backup_codes.filter((c: string) => c !== upperCode);
            await supabase
              .from("user_2fa")
              .update({ backup_codes: newCodes, updated_at: new Date().toISOString() })
              .eq("user_id", userId);

            return new Response(
              JSON.stringify({ success: true, valid: true, usedBackupCode: true }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          return new Response(
            JSON.stringify({ error: "Código de backup inválido", valid: false }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(settings.secret, code);

        return new Response(
          JSON.stringify({ valid: isValid, success: isValid }),
          { status: isValid ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disable": {
        // Verify code before disabling
        const { data: settings } = await supabase
          .from("user_2fa")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!settings?.enabled) {
          return new Response(
            JSON.stringify({ error: "2FA não está ativado" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(settings.secret, code);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Código inválido" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete 2FA settings
        const { error: deleteError } = await supabase
          .from("user_2fa")
          .delete()
          .eq("user_id", userId);

        if (deleteError) {
          console.error("Error disabling 2FA:", deleteError);
          return new Response(
            JSON.stringify({ error: "Erro ao desativar 2FA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "2FA desativado com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        const { data: settings } = await supabase
          .from("user_2fa")
          .select("enabled, verified_at, backup_codes")
          .eq("user_id", userId)
          .single();

        return new Response(
          JSON.stringify({
            enabled: settings?.enabled || false,
            verifiedAt: settings?.verified_at,
            backupCodesRemaining: settings?.backup_codes?.length || 0,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "regenerate-backup": {
        // Verify code before regenerating backup codes
        const { data: settings } = await supabase
          .from("user_2fa")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!settings?.enabled) {
          return new Response(
            JSON.stringify({ error: "2FA não está ativado" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(settings.secret, code);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Código inválido" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const newBackupCodes = generateBackupCodes();

        const { error: updateError } = await supabase
          .from("user_2fa")
          .update({
            backup_codes: newBackupCodes,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error regenerating backup codes:", updateError);
          return new Response(
            JSON.stringify({ error: "Erro ao regenerar códigos" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, backupCodes: newBackupCodes }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Error in 2FA function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
