import { useState, useEffect } from 'react';
import { Shield, Copy, Check, Loader2, QrCode, Key, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { use2FA } from '@/hooks/use2FA';
import { cn } from '@/lib/utils';

interface TwoFactorSetupProps {
  onStatusChange?: (enabled: boolean) => void;
}

export function TwoFactorSetup({ onStatusChange }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const { 
    isLoading, 
    status, 
    fetchStatus, 
    setup, 
    verifySetup, 
    disable, 
    regenerateBackupCodes 
  } = use2FA();
  
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showRegenerateBackup, setShowRegenerateBackup] = useState(false);
  
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpauthUrl: string;
    backupCodes: string[];
  } | null>(null);
  
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [step, setStep] = useState<'qr' | 'verify' | 'backup' | 'complete'>('qr');

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleStartSetup = async () => {
    const result = await setup();
    
    if (result.success && result.secret && result.otpauthUrl && result.backupCodes) {
      setSetupData({
        secret: result.secret,
        otpauthUrl: result.otpauthUrl,
        backupCodes: result.backupCodes,
      });
      setStep('qr');
      setShowSetup(true);
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao iniciar configuração',
        variant: 'destructive',
      });
    }
  };

  const handleVerifySetup = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'Digite o código de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    const result = await verifySetup(verificationCode);
    
    if (result.success) {
      setStep('backup');
      onStatusChange?.(true);
    } else {
      toast({
        title: 'Código inválido',
        description: result.error || 'O código não corresponde',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteSetup = () => {
    setStep('complete');
    setTimeout(() => {
      setShowSetup(false);
      setSetupData(null);
      setVerificationCode('');
      setStep('qr');
      toast({
        title: '2FA Ativado!',
        description: 'Autenticação de dois fatores configurada com sucesso',
      });
    }, 2000);
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'Digite o código de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    const result = await disable(disableCode);
    
    if (result.success) {
      setShowDisable(false);
      setDisableCode('');
      onStatusChange?.(false);
      toast({
        title: '2FA Desativado',
        description: 'Autenticação de dois fatores foi desativada',
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Código inválido',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateBackup = async () => {
    if (regenerateCode.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'Digite o código de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    const result = await regenerateBackupCodes(regenerateCode);
    
    if (result.success && result.backupCodes) {
      setNewBackupCodes(result.backupCodes);
      setRegenerateCode('');
      setShowRegenerateBackup(false);
      setShowBackupCodes(true);
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Código inválido',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllBackupCodes = async (codes: string[]) => {
    await navigator.clipboard.writeText(codes.join('\n'));
    toast({
      title: 'Copiado!',
      description: 'Todos os códigos foram copiados',
    });
  };

  // QR Code component using a public API
  const QRCodeImage = ({ url }: { url: string }) => (
    <img 
      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
      alt="QR Code para configurar 2FA"
      className="w-48 h-48 mx-auto rounded-lg border border-border"
    />
  );

  return (
    <>
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Autenticação de Dois Fatores (2FA)
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">App Autenticador</p>
              <p className="text-xs text-muted-foreground">
                {status?.enabled 
                  ? `Ativo • ${status.backupCodesRemaining} códigos de backup restantes`
                  : 'Use um app como Google Authenticator ou Authy'}
              </p>
            </div>
            
            {status?.enabled ? (
              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                Ativo
              </span>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleStartSetup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Configurar'
                )}
              </Button>
            )}
          </div>
          
          {status?.enabled && (
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary h-auto p-1"
                onClick={() => setShowRegenerateBackup(true)}
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Novos códigos de backup
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive h-auto p-1"
                onClick={() => setShowDisable(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Desativar 2FA
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={(open) => {
        if (!open && step !== 'complete') {
          // Allow closing only if not in the middle of setup
          if (step === 'qr') {
            setShowSetup(false);
            setSetupData(null);
          }
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {step === 'qr' && 'Configurar 2FA'}
              {step === 'verify' && 'Verificar Código'}
              {step === 'backup' && 'Códigos de Backup'}
              {step === 'complete' && '2FA Ativado!'}
            </DialogTitle>
            <DialogDescription>
              {step === 'qr' && 'Escaneie o QR Code com seu aplicativo autenticador'}
              {step === 'verify' && 'Digite o código gerado pelo app'}
              {step === 'backup' && 'Guarde estes códigos em local seguro'}
              {step === 'complete' && 'Configuração concluída com sucesso'}
            </DialogDescription>
          </DialogHeader>

          {step === 'qr' && setupData && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                <QRCodeImage url={setupData.otpauthUrl} />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Ou digite a chave manualmente:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 text-xs bg-muted rounded font-mono break-all">
                    {setupData.secret}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(setupData.secret, -1)}
                  >
                    {copiedIndex === -1 ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSetup(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setStep('verify')}>
                  Próximo
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Código de verificação</Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Digite o código de 6 dígitos do seu app autenticador
                </p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('qr')}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleVerifySetup}
                  disabled={verificationCode.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Verificar
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'backup' && setupData && (
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Importante:</strong> Guarde estes códigos em local seguro. 
                  Cada código só pode ser usado uma vez.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {setupData.backupCodes.map((code, index) => (
                  <button
                    key={code}
                    onClick={() => copyToClipboard(code, index)}
                    className={cn(
                      "p-2 text-sm font-mono bg-muted rounded text-center transition-colors",
                      "hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary",
                      copiedIndex === index && "bg-primary/10 text-primary"
                    )}
                  >
                    {copiedIndex === index ? (
                      <span className="flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Copiado
                      </span>
                    ) : (
                      code
                    )}
                  </button>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => copyAllBackupCodes(setupData.backupCodes)}
              >
                <Copy className="w-4 h-4 mr-2" /> Copiar todos
              </Button>
              
              <DialogFooter>
                <Button onClick={handleCompleteSetup} className="w-full">
                  Concluir configuração
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'complete' && (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <p className="text-center text-muted-foreground">
                Sua conta agora está protegida com autenticação de dois fatores
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisable} onOpenChange={setShowDisable}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" />
              Desativar 2FA
            </DialogTitle>
            <DialogDescription>
              Isso vai remover a proteção adicional da sua conta. 
              Digite o código do seu app autenticador para confirmar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="disable-code">Código de verificação</Label>
            <Input
              id="disable-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-widest font-mono"
              autoComplete="one-time-code"
            />
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDisable(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDisable}
              disabled={disableCode.length !== 6 || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={showRegenerateBackup} onOpenChange={setShowRegenerateBackup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Novos Códigos de Backup
            </DialogTitle>
            <DialogDescription>
              Isso vai invalidar todos os códigos de backup anteriores.
              Digite o código do seu app autenticador para confirmar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="regenerate-code">Código de verificação</Label>
            <Input
              id="regenerate-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={regenerateCode}
              onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-widest font-mono"
              autoComplete="one-time-code"
            />
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRegenerateBackup(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRegenerateBackup}
              disabled={regenerateCode.length !== 6 || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Gerar novos códigos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Novos Códigos de Backup
            </DialogTitle>
            <DialogDescription>
              Guarde estes códigos em local seguro. Cada código só pode ser usado uma vez.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-2">
            {newBackupCodes.map((code, index) => (
              <button
                key={code}
                onClick={() => copyToClipboard(code, index)}
                className={cn(
                  "p-2 text-sm font-mono bg-muted rounded text-center transition-colors",
                  "hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary",
                  copiedIndex === index && "bg-primary/10 text-primary"
                )}
              >
                {copiedIndex === index ? (
                  <span className="flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> Copiado
                  </span>
                ) : (
                  code
                )}
              </button>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => copyAllBackupCodes(newBackupCodes)}
          >
            <Copy className="w-4 h-4 mr-2" /> Copiar todos
          </Button>
          
          <DialogFooter>
            <Button onClick={() => setShowBackupCodes(false)} className="w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
