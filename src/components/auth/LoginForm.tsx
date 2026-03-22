import React from 'react';
import { Eye, EyeOff, Lock, Mail, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';

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
  isAvailable: boolean;
  isRegistered: boolean;
  registeredEmail: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBiometricLogin: () => void;
  onForgotPassword: () => void;
  onGoogleError: (error: string) => void;
}

export function LoginForm({
  email,
  password,
  showPassword,
  isSubmitting,
  lockoutState,
  isAvailable,
  isRegistered,
  registeredEmail,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onBiometricLogin,
  onForgotPassword,
  onGoogleError,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Biometric Login Button */}
      {isAvailable && isRegistered && (
        <Button 
          type="button"
          variant="outline"
          className="w-full h-14 font-semibold border-2 border-primary/30 hover:border-primary hover:bg-primary/5"
          onClick={onBiometricLogin}
          disabled={isSubmitting}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">Entrar com Face ID / Touch ID</div>
              <div className="text-xs text-muted-foreground">{registeredEmail}</div>
            </div>
          </div>
        </Button>
      )}

      {isAvailable && isRegistered && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou continue com email</span>
          </div>
        </div>
      )}

      {/* Lockout Warning */}
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

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      {/* Google Login */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 font-semibold"
        disabled={isSubmitting}
        onClick={async () => {
          const { error } = await lovable.auth.signInWithOAuth('google', {
            redirect_uri: window.location.origin,
          });
          if (error) {
            onGoogleError(error instanceof Error ? error.message : 'Tente novamente');
          }
        }}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Entrar com Google
      </Button>

      <button
        type="button"
        onClick={onForgotPassword}
        className="w-full text-sm text-primary hover:underline"
      >
        Esqueceu sua senha?
      </button>

      {isAvailable && !isRegistered && (
        <p className="text-xs text-center text-muted-foreground">
          <Fingerprint className="inline w-3 h-3 mr-1" />
          Após o login, você poderá ativar Face ID / Touch ID
        </p>
      )}
    </form>
  );
}
