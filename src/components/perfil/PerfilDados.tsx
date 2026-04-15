import { Edit2, MapPin, Phone, Mail, Briefcase, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Profile {
  nome: string;
  email: string;
  cargo: string | null;
  departamento: string | null;
  data_admissao: string | null;
}

interface PerfilDadosProps {
  profile: Profile;
  onSolicitar: (tipo: 'endereco' | 'contato' | 'bancario') => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function PerfilDados({ profile, onSolicitar }: PerfilDadosProps) {
  return (
    <>
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
          {profile.data_admissao && <InfoRow label="Data Admissão" value={formatDate(profile.data_admissao)} />}
        </div>
      </Card>

      {/* Contato */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Phone className="w-4 h-4" /> Contato
          </h3>
          <Button variant="ghost" size="sm" className="text-primary h-auto p-1" onClick={() => onSolicitar('contato')}>
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
          {profile.data_admissao && <InfoRow label="Data Admissão" value={formatDate(profile.data_admissao)} />}
        </div>
      </Card>

      {/* Endereço */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Endereço
          </h3>
          <Button variant="ghost" size="sm" className="text-primary h-auto p-1" onClick={() => onSolicitar('endereco')}>
            <Edit2 className="w-4 h-4 mr-1" /> Solicitar Alteração
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Para atualizar seu endereço, clique em "Solicitar Alteração"</p>
      </Card>

      {/* Dados Bancários */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Dados Bancários
          </h3>
          <Button variant="ghost" size="sm" className="text-primary h-auto p-1" onClick={() => onSolicitar('bancario')}>
            <Edit2 className="w-4 h-4 mr-1" /> Solicitar Alteração
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Para atualizar seus dados bancários, clique em "Solicitar Alteração"</p>
      </Card>
    </>
  );
}
