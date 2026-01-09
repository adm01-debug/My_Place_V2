import { useState } from 'react';
import { Camera, Edit2, MapPin, Phone, Mail, Briefcase, CreditCard, Fingerprint, Trash2, Loader2, Award, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { PageLayout } from '@/components/portal/PageLayout';
import { ProfileSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { PushNotificationSettings } from '@/components/portal/PushNotificationSettings';
import { BadgeDisplay } from '@/components/portal/BadgeDisplay';
import { TrilhaProgress } from '@/components/portal/TrilhaProgress';
import { TwoFactorSetup } from '@/components/portal/TwoFactorSetup';
import { useKudos } from '@/hooks/useKudos';
import { useTrilhas } from '@/hooks/useTrilhas';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Perfil() {
  const isLoading = useLoadingState(500);
  const { user, profile } = useAuth();
  const { meusBadges, meusPontos, nivelAtual } = useKudos();
  const { trilhasEmAndamento } = useTrilhas();
  const { isAvailable, isRegistered, registeredEmail, registerBiometric, removeBiometric } = useBiometricAuth();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [tipoSolicitacao, setTipoSolicitacao] = useState<'endereco' | 'contato' | 'bancario' | null>(null);
  const [formData, setFormData] = useState({ descricao: '' });

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

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

  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload para Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({ title: 'Foto atualizada!', description: 'Recarregue a página para ver a nova foto.' });
    } catch (error: any) {
      toast({ title: 'Erro ao enviar foto', description: error.message, variant: 'destructive' });
    }

    setIsUploading(false);
  };

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
          <ListItemSkeleton />
        </div>
      </PageLayout>
    );
  }

  const initials = profile.nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <PageLayout title="Meu Perfil" showBack>
      <div className="space-y-6 animate-fade-in-up">
        {/* Avatar e Info Principal */}
        <div className="text-center">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.nome} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleUploadFoto}
                disabled={isUploading}
              />
              <Button 
                size="icon" 
                variant="secondary" 
                className="w-8 h-8 rounded-full shadow-md cursor-pointer"
                asChild
              >
                <span>
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </span>
              </Button>
            </label>
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mt-4">
            {profile.nome}
          </h2>
          {profile.matricula && (
            <p className="text-sm text-muted-foreground">
              Matrícula: {profile.matricula}
            </p>
          )}
        </div>

        {/* Dados Pessoais */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            📋 Dados Pessoais
          </h3>
          <div className="space-y-3">
            <InfoRow label="Nome" value={profile.nome} />
            <InfoRow label="E-mail" value={profile.email} />
            {profile.cargo && <InfoRow label="Cargo" value={profile.cargo} />}
            {profile.departamento && <InfoRow label="Departamento" value={profile.departamento} />}
            {profile.data_admissao && (
              <InfoRow label="Data Admissão" value={formatDate(profile.data_admissao)} />
            )}
          </div>
        </Card>

        {/* Contato */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Phone className="w-4 h-4" /> Contato
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary h-auto p-1"
              onClick={() => openSolicitacao('contato')}
            >
              <Edit2 className="w-4 h-4 mr-1" /> Atualizar
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{profile.email}</span>
            </div>
          </div>
        </Card>

        {/* Dados Profissionais */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Dados Profissionais
          </h3>
          <div className="space-y-3">
            {profile.cargo && <InfoRow label="Cargo" value={profile.cargo} />}
            {profile.departamento && <InfoRow label="Departamento" value={profile.departamento} />}
            {profile.data_admissao && (
              <InfoRow label="Data Admissão" value={formatDate(profile.data_admissao)} />
            )}
          </div>
        </Card>

        {/* Endereço */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Endereço
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary h-auto p-1"
              onClick={() => openSolicitacao('endereco')}
            >
              <Edit2 className="w-4 h-4 mr-1" /> Solicitar Alteração
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Para atualizar seu endereço, clique em "Solicitar Alteração"
          </p>
        </Card>

        {/* Dados Bancários */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Dados Bancários
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary h-auto p-1"
              onClick={() => openSolicitacao('bancario')}
            >
              <Edit2 className="w-4 h-4 mr-1" /> Solicitar Alteração
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Para atualizar seus dados bancários, clique em "Solicitar Alteração"
          </p>
        </Card>

        {/* Notificações Push */}
        <PushNotificationSettings />

        {/* Autenticação de Dois Fatores */}
        <TwoFactorSetup />

        {/* Segurança - Autenticação Biométrica */}
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
                <Switch 
                  checked={isRegistered} 
                  onCheckedChange={handleToggleBiometric}
                />
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
      </div>

      {/* Modal de Solicitação de Alteração */}
      <Dialog open={showSolicitacao} onOpenChange={setShowSolicitacao}>

        {/* Seção de Conquistas e Desenvolvimento */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Minhas Conquistas
          </h3>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Nível Atual</span>
              <span className="font-bold text-lg">{nivelAtual}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pontos</span>
              <span className="font-medium">{meusPontos?.pontos_recebidos || 0}</span>
            </div>
          </div>
          {meusBadges && meusBadges.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {meusBadges.slice(0, 8).map(b => (
                <div key={b.badge_id} className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <span className="text-2xl">{b.badge?.icone || '🏅'}</span>
                  <p className="text-xs mt-1 truncate">{b.badge?.nome}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma conquista ainda. Continue interagindo!
            </p>
          )}
        </Card>

        {/* Trilhas em Andamento */}
        {trilhasEmAndamento && trilhasEmAndamento.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Trilhas em Andamento
            </h3>
            <div className="space-y-3">
              {trilhasEmAndamento.slice(0, 3).map(t => (
                <TrilhaProgress
                  key={t.id}
                  nome={t.nome}
                  nivel={t.nivel}
                  etapas={t.etapas || []}
                  etapasConcluidas={t.progresso?.progresso_percentual ? Math.round((t.progresso.progresso_percentual / 100) * (t.etapas?.length || 1)) : 0}
                  progressoPercentual={t.progresso?.progresso_percentual || 0}
                  status={t.progresso?.status || 'nao_iniciada'}
                  compact={true}
                />
              ))}
            </div>
          </Card>
        )}

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
            <Button 
              onClick={handleSolicitarAlteracao}
              disabled={!formData.descricao.trim()}
            >
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
