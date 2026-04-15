import { Fingerprint, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PushNotificationSettings } from '@/components/portal/PushNotificationSettings';
import { TwoFactorSetup } from '@/components/portal/TwoFactorSetup';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function PerfilSeguranca() {
  const { user } = useAuth();
  const { isAvailable, isRegistered, registeredEmail, registerBiometric, removeBiometric } = useBiometricAuth();
  const { toast } = useToast();

  const handleToggleBiometric = async () => {
    if (isRegistered) {
      removeBiometric();
      toast({ title: 'Autenticação biométrica desativada' });
    } else if (user) {
      const result = await registerBiometric(user.email || '', user.id);
      if (result.success) {
        toast({ title: 'Autenticação biométrica ativada' });
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    }
  };

  return (
    <>
      <PushNotificationSettings />
      <TwoFactorSetup />

      {isAvailable && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <Fingerprint className="w-4 h-4" /> Segurança
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Face ID / Touch ID</p>
                <p className="text-xs text-muted-foreground">
                  {isRegistered
                    ? `Ativo para ${registeredEmail}`
                    : 'Use biometria para login mais rápido'}
                </p>
              </div>
              <Switch checked={isRegistered} onCheckedChange={handleToggleBiometric} />
            </div>
            {isRegistered && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive h-auto p-1"
                onClick={() => {
                  removeBiometric();
                  toast({ title: 'Autenticação biométrica removida' });
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Remover credencial biométrica
              </Button>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
