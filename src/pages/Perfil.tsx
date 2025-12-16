import { ArrowLeft, Camera, Edit2, MapPin, Phone, Mail, Briefcase, Building, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PageLayout } from '@/components/portal/PageLayout';
import { ProfileSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { mockColaborador } from '@/data/mockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Perfil() {
  const colaborador = mockColaborador;
  const isLoading = useLoadingState(800);
  
  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  if (isLoading) {
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

  return (
    <PageLayout title="Meu Perfil" showBack>
      <div className="space-y-6 animate-fade-in-up">
        {/* Avatar e Info Principal */}
        <div className="text-center">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
              <AvatarImage src={colaborador.foto} alt={colaborador.nome} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {colaborador.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            <Button 
              size="icon" 
              variant="secondary" 
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-md"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mt-4">
            {colaborador.nome}
          </h2>
          <p className="text-sm text-muted-foreground">
            Matrícula: {colaborador.matricula}
          </p>
        </div>

        {/* Dados Pessoais */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            📋 Dados Pessoais
          </h3>
          <div className="space-y-3">
            <InfoRow label="Nome" value={colaborador.nome} />
            <InfoRow label="CPF" value={colaborador.cpf} />
            <InfoRow label="Data Nascimento" value={formatDate(colaborador.dataNascimento)} />
            <InfoRow label="Estado Civil" value={colaborador.estadoCivil} />
          </div>
        </Card>

        {/* Endereço */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Endereço
            </h3>
            <Button variant="ghost" size="sm" className="text-primary h-auto p-1">
              <Edit2 className="w-4 h-4 mr-1" /> Solicitar Alteração
            </Button>
          </div>
          <p className="text-sm text-foreground">
            {colaborador.endereco.logradouro}, {colaborador.endereco.numero}
            {colaborador.endereco.complemento && ` - ${colaborador.endereco.complemento}`}
          </p>
          <p className="text-sm text-foreground">
            {colaborador.endereco.bairro} - {colaborador.endereco.cidade}/{colaborador.endereco.estado}
          </p>
          <p className="text-sm text-muted-foreground">
            CEP: {colaborador.endereco.cep}
          </p>
        </Card>

        {/* Contato */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Phone className="w-4 h-4" /> Contato
            </h3>
            <Button variant="ghost" size="sm" className="text-primary h-auto p-1">
              <Edit2 className="w-4 h-4 mr-1" /> Atualizar
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{colaborador.telefone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{colaborador.email}</span>
            </div>
          </div>
        </Card>

        {/* Dados Profissionais */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Dados Profissionais
          </h3>
          <div className="space-y-3">
            <InfoRow label="Cargo" value={colaborador.cargo} />
            <InfoRow label="Departamento" value={colaborador.departamento} />
            <InfoRow label="Data Admissão" value={formatDate(colaborador.dataAdmissao)} />
            <InfoRow label="Tempo de Casa" value={colaborador.tempoCasa} />
            <InfoRow label="Gestor" value={colaborador.gestor} />
          </div>
        </Card>

        {/* Dados Bancários */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Dados Bancários
            </h3>
            <Button variant="ghost" size="sm" className="text-primary h-auto p-1">
              <Edit2 className="w-4 h-4 mr-1" /> Solicitar Alteração
            </Button>
          </div>
          <div className="space-y-3">
            <InfoRow label="Banco" value={colaborador.banco} />
            <InfoRow label="Agência" value={colaborador.agencia} />
            <InfoRow label="Conta" value={colaborador.conta} />
          </div>
        </Card>
      </div>
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
