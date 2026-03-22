import React from 'react';
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignupFormProps {
  email: string;
  password: string;
  nome: string;
  showPassword: boolean;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNomeChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  };

  const strength = getStrength();
  const colors = ['bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  const requirements = [
    { text: '6+ caracteres', valid: password.length >= 6 },
    { text: 'Letra maiúscula', valid: /[A-Z]/.test(password) },
    { text: 'Letra minúscula', valid: /[a-z]/.test(password) },
    { text: 'Número', valid: /[0-9]/.test(password) },
  ];

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength ? colors[strength - 1] : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        Força: {labels[strength]}
      </span>
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <CheckCircle2 
              className={`w-3 h-3 ${req.valid ? 'text-green-500' : 'text-muted-foreground/40'}`} 
            />
            <span className={`text-xs ${req.valid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SignupForm({
  email,
  password,
  nome,
  showPassword,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onNomeChange,
  onTogglePassword,
  onSubmit,
}: SignupFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-nome">Nome completo</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-nome"
            type="text"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(e) => onNomeChange(e.target.value)}
            className="pl-10"
            disabled={isSubmitting}
            autoComplete="name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email corporativo</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-email"
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

      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Crie uma senha forte"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="pl-10 pr-10"
            disabled={isSubmitting}
            autoComplete="new-password"
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
        {password.length > 0 && <PasswordStrength password={password} />}
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Criando conta...
          </div>
        ) : (
          'Criar conta'
        )}
      </Button>
    </form>
  );
}
