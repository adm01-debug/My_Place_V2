import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';

interface LockoutState {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: Date | null;
}

interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  isSubmitting: boolean;
  lockoutState: LockoutState | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
}

export function LoginForm({
  email,
  password,
  showPassword,
  isSubmitting,
  lockoutState,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onForgotPassword,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {lockoutState && (
        <Alert variant={lockoutState.isLocked ? "destructive" : "default"} className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm">
            {lockoutState.isLocked ? (
              <>
                <strong>Conta bloqueada temporariamente.</strong>
                <br />
                {lockoutState.lockedUntil && (
                  <span>
                    Tente novamente em {Math.max(1, Math.ceil((lockoutState.lockedUntil.getTime() - Date.now()) / 60000))} minuto(s) ou recupere sua senha.
                  </span>
                )}
              </>
            ) : (
              <>
                <strong>Atenção:</strong> {lockoutState.remainingAttempts} tentativa{lockoutState.remainingAttempts !== 1 ? 's' : ''} restante{lockoutState.remainingAttempts !== 1 ? 's' : ''} antes do bloqueio.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-email">Email corporativo</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder="seu.email@empresa.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="pl-10"
            disabled={isSubmitting || lockoutState?.isLocked}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="pl-10 pr-10"
            disabled={isSubmitting || lockoutState?.isLocked}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 font-semibold"
        disabled={isSubmitting || lockoutState?.isLocked}
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Entrando...
          </div>
        ) : (
          'Entrar'
        )}
      </Button>

      <button
        type="button"
        onClick={onForgotPassword}
        className="w-full text-sm text-primary hover:underline"
      >
        Esqueceu sua senha?
      </button>

      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
          ou continue com
        </span>
      </div>

      <GoogleSignInButton />
      
      <p className="text-center text-[10px] text-muted-foreground mt-4 px-4 leading-relaxed">
        Ao entrar, você concorda com nossos <a href="#" className="underline hover:text-primary">Termos de Uso</a> e <a href="#" className="underline hover:text-primary">Política de Privacidade</a>.
      </p>
    </form>
  );
}

function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Usando Supabase diretamente para ter mais controle se necessário, 
      // ou mantendo o padrão Lovable para consistência.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) {
        console.error("Google sign-in error:", error);
      }
    } catch (err) {
      console.error("Google sign-in failed:", err);
    } finally {
      // O redirect acontece, então o loading só para se falhar
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 gap-2"
      onClick={handleGoogleSignIn}
      disabled={loading}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {loading ? 'Conectando...' : 'Entrar com Google'}
    </Button>
  );
}
