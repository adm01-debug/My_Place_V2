import { useState } from 'react';
import { PageLayout } from '@/components/portal/PageLayout';
import { ProfileSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { PerfilAvatar } from '@/components/perfil/PerfilAvatar';
import { PerfilDados } from '@/components/perfil/PerfilDados';
import { PerfilSeguranca } from '@/components/perfil/PerfilSeguranca';
import { PerfilConquistas } from '@/components/perfil/PerfilConquistas';
import { useKudos } from '@/hooks/useKudos';
import { useTrilhas } from '@/hooks/useTrilhas';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Perfil() {
  const isLoading = useLoadingState(500);
  const { user, profile } = useAuth();
  const { meusBadges, meusPontos, nivelAtual } = useKudos();
  const { trilhasEmAndamento } = useTrilhas();
  const { toast } = useToast();

  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [tipoSolicitacao, setTipoSolicitacao] = useState<'endereco' | 'contato' | 'bancario' | null>(null);
  const [formData, setFormData] = useState({ descricao: '' });

  const handleSolicitarAlteracao = async () => {
    if (!user || !tipoSolicitacao) return;

    const tipoLabels = {
      endereco: 'Alteração de Endereço',
      contato: 'Alteração de Contato',
      bancario: 'Alteração de Dados Bancários',
    };

    const { error } = await supabase.from('solicitacoes').insert({
      user_id: user.id,
      tipo: 'cadastro',
      titulo: tipoLabels[tipoSolicitacao],
      descricao: formData.descricao,
      prioridade: 'normal',
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Solicitação enviada!', description: 'O RH irá analisar sua solicitação.' });
      setShowSolicitacao(false);
      setFormData({ descricao: '' });
    }
  };

  const openSolicitacao = (tipo: 'endereco' | 'contato' | 'bancario') => {
    setTipoSolicitacao(tipo);
    setShowSolicitacao(true);
  };

  if (isLoading || !profile) {
    return (
      <PageLayout title="Meu Perfil" showBack>
        <div className="space-y-6">
          <ProfileSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meu Perfil" showBack>
      <div className="space-y-6 animate-fade-in-up">
        <PerfilAvatar
          userId={user?.id || ''}
          nome={profile.nome}
          avatarUrl={profile.avatar_url}
          matricula={profile.matricula}
        />

        <PerfilDados profile={profile} onSolicitar={openSolicitacao} />

        <PerfilSeguranca />
      </div>

      <PerfilConquistas
        meusBadges={meusBadges}
        meusPontos={meusPontos ?? undefined}
        nivelAtual={String(nivelAtual)}
        trilhasEmAndamento={trilhasEmAndamento}
      />

      {/* Modal de Solicitação */}
      <Dialog open={showSolicitacao} onOpenChange={setShowSolicitacao}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Solicitar Alteração de {
                tipoSolicitacao === 'endereco' ? 'Endereço' :
                tipoSolicitacao === 'contato' ? 'Contato' : 'Dados Bancários'
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descreva a alteração necessária *</Label>
              <Textarea
                placeholder={
                  tipoSolicitacao === 'endereco'
                    ? 'Informe o novo endereço completo...'
                    : tipoSolicitacao === 'contato'
                    ? 'Informe o novo telefone/email...'
                    : 'Informe os novos dados bancários (banco, agência, conta)...'
                }
                value={formData.descricao}
                onChange={(e) => setFormData({ descricao: e.target.value })}
                rows={4}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sua solicitação será enviada ao RH para análise e aprovação.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSolicitacao(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitarAlteracao} disabled={!formData.descricao.trim()}>
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
