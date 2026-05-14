import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requirementsVisible, setRequirementsVisible] = useState(false);

  // Check for valid reset session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there's an error in URL params, show it
      const errorDescription = searchParams.get("error_description");
      if (errorDescription) {
        setError(errorDescription);
        return;
      }

      // Check if this is a password recovery session
      const type = searchParams.get("type");
      if (type !== "recovery" && !session) {
        setError("Link de redefinição inválido ou expirado. Por favor, solicite um novo link.");
      }
    };

    checkSession();

    // Listen for auth state changes (password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // User clicked the recovery link, ready to set new password
          setError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const validatePassword = useCallback((pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Mínimo de 8 caracteres");
    if (!/[A-Z]/.test(pwd)) errors.push("Uma letra maiúscula");
    if (!/[a-z]/.test(pwd)) errors.push("Uma letra minúscula");
    if (!/[0-9]/.test(pwd)) errors.push("Um número");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push("Um caractere especial");
    return errors;
  }, []);

  const passwordErrors = validatePassword(password);
  const isPasswordValid = passwordErrors.length === 0;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast.error("A senha não atende aos requisitos mínimos");
      return;
    }

    if (!passwordsMatch) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Senha redefinida com sucesso!");
      
      // Clear sensitive states
      setPassword("");
      setConfirmPassword("");
      
      // Sign out and redirect to login after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao redefinir senha";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Link Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/login")} 
              className="w-full"
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Senha Redefinida!</CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso. Você será redirecionado para o login.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!requirementsVisible) setRequirementsVisible(true);
                  }}
                  onFocus={() => setRequirementsVisible(true)}
                  placeholder="Mínimo 8 chars, A-z, 0-9, @"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              
              {/* Password requirements */}
              {requirementsVisible && (
                <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Segurança da Senha:</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {[
                      { text: "8+ caracteres", valid: password.length >= 8 },
                      { text: "Letra maiúscula", valid: /[A-Z]/.test(password) },
                      { text: "Letra minúscula", valid: /[a-z]/.test(password) },
                      { text: "Número", valid: /[0-9]/.test(password) },
                      { text: "Especial (!@#)", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <div className={`h-1.5 w-1.5 rounded-full ${req.valid ? "bg-green-500" : "bg-muted"}`} />
                        <span className={`text-xs ${req.valid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-xs ${passwordsMatch ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                  {passwordsMatch ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isPasswordValid || !passwordsMatch}
            >
              {loading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
