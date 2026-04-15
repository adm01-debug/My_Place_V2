import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
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
    </form>
  );
}
