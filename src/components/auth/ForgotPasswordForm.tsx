import React from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardTitle, CardDescription } from '@/components/ui/card';

interface ForgotPasswordFormProps {
  email: string;
  isSubmitting: boolean;
  resetEmailSent: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function ForgotPasswordForm({
  email,
  isSubmitting,
  resetEmailSent,
  onEmailChange,
  onSubmit,
  onBack,
}: ForgotPasswordFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </button>
        <CardTitle className="text-xl">Recuperar senha</CardTitle>
        <CardDescription>
          {resetEmailSent 
            ? 'Verifique seu email para redefinir sua senha'
            : 'Digite seu email para receber o link de recuperação'
          }
        </CardDescription>
      </div>

      {resetEmailSent ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Enviamos um link para <strong>{email}</strong>. 
            Clique no link do email para criar uma nova senha.
          </p>
          <Button variant="outline" className="w-full" onClick={onBack}>
            Voltar ao login
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email corporativo</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="pl-10"
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full h-11 font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Enviando...
              </div>
            ) : (
              'Enviar link de recuperação'
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
