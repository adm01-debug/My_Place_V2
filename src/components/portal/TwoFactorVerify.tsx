import { useState } from 'react';
import { Shield, Loader2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { use2FA } from '@/hooks/use2FA';

interface TwoFactorVerifyProps {
  onVerified: () => void;
  onCancel?: () => void;
}

export function TwoFactorVerify({ onVerified, onCancel }: TwoFactorVerifyProps) {
  const { toast } = useToast();
  const { isLoading, verify } = use2FA();
  
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  const handleVerify = async () => {
    const codeToVerify = useBackupCode ? backupCode : code;
    
    if (!codeToVerify) {
      toast({
        title: 'Código obrigatório',
        description: useBackupCode 
          ? 'Digite um código de backup' 
          : 'Digite o código de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    if (!useBackupCode && codeToVerify.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'Digite o código de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    const result = await verify(codeToVerify, useBackupCode);
    
    if (result.success && result.valid) {
      if (result.usedBackupCode) {
        toast({
          title: 'Código de backup usado',
          description: 'Considere gerar novos códigos de backup',
        });
      }
      onVerified();
    } else {
      toast({
        title: 'Código inválido',
        description: result.error || 'O código não corresponde',
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-subtle border-border/50 shadow-xl">
      <CardHeader className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-xl">Verificação de Dois Fatores</CardTitle>
        <CardDescription>
          {useBackupCode 
            ? 'Digite um dos seus códigos de backup'
            : 'Digite o código de 6 dígitos do seu app autenticador'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!useBackupCode ? (
          <div className="space-y-2">
            <Label htmlFor="totp-code">Código de verificação</Label>
            <Input
              id="totp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={handleKeyDown}
              className="text-center text-2xl tracking-widest font-mono"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="backup-code">Código de backup</Label>
            <Input
              id="backup-code"
              type="text"
              placeholder="XXXX-XXXX"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              className="text-center text-xl tracking-wider font-mono"
              autoFocus
            />
          </div>
        )}
        
        <Button 
          onClick={handleVerify}
          disabled={isLoading || (!useBackupCode && code.length !== 6) || (useBackupCode && !backupCode)}
          className="w-full h-11"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Verificar
        </Button>
        
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
              setBackupCode('');
            }}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Key className="w-3 h-3" />
            {useBackupCode ? 'Usar código do app' : 'Usar código de backup'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
