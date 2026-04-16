import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Briefcase, Calendar, Hash, Shield, 
  Sun, Clock, Palmtree, Receipt, FileText, type LucideIcon,
  Bell
} from 'lucide-react';
import { HoursChart, SalaryChart, GoalsProgress } from '@/components/home/DashboardCharts';
import { supabase } from '@/integrations/supabase/client';
import { PullToRefresh } from '@/components/portal/PullToRefresh';

function ProfileInfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

interface QuickAccessItem {
  icon: LucideIcon;
  label: string;
  description: string;
  path: string;
  color: string;
}

const quickAccessItems: QuickAccessItem[] = [
  { icon: Clock, label: 'Ponto', description: 'Registrar entrada/saída', path: '/ponto', color: 'text-blue-500 bg-blue-500/10' },
  { icon: Palmtree, label: 'Férias', description: 'Solicitar e consultar', path: '/ferias', color: 'text-emerald-500 bg-emerald-500/10' },
  { icon: Receipt, label: 'Holerites', description: 'Consultar pagamentos', path: '/holerites', color: 'text-amber-500 bg-amber-500/10' },
  { icon: FileText, label: 'Solicitações', description: 'Abrir e acompanhar', path: '/solicitacoes', color: 'text-purple-500 bg-purple-500/10' },
];

function QuickAccessCard({ item, onClick }: { item: QuickAccessItem; onClick: () => void }) {
  const [iconColor, bgColor] = item.color.split(' ');
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgColor}`}>
        <item.icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{item.label}</p>
        <p className="text-xs text-muted-foreground leading-tight">{item.description}</p>
      </div>
    </button>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Home() {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState({ ferias: 0, solicitacoes: 0, notificacoes: 0 });

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    const [f, s, n] = await Promise.all([
      supabase.from('solicitacoes_ferias').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pendente'),
      supabase.from('solicitacoes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pendente'),
      supabase.from('notificacoes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('lida', false),
    ]);
    setPendingCount({ ferias: f.count || 0, solicitacoes: s.count || 0, notificacoes: n.count || 0 });
  }, [user]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const firstName = profile?.nome?.split(' ')[0] || 'Colaborador';

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    colaborador: 'Colaborador',
  };

  const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    gestor: 'secondary',
    colaborador: 'outline',
  };

  return (
    <PullToRefresh onRefresh={fetchCounts}>
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-12 space-y-6">
        {/* Greeting */}
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-muted-foreground">{getGreeting()}, <span className="font-medium text-foreground">{firstName}</span></span>
        </div>

        {/* Pending Summary */}
        {(pendingCount.ferias > 0 || pendingCount.solicitacoes > 0 || pendingCount.notificacoes > 0) && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pendingCount.notificacoes > 0 && (
              <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary shrink-0">
                <Bell className="w-3.5 h-3.5" />
                {pendingCount.notificacoes} notificação(ões)
              </button>
            )}
            {pendingCount.ferias > 0 && (
              <button onClick={() => navigate('/ferias')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                <Palmtree className="w-3.5 h-3.5" />
                {pendingCount.ferias} férias pendente(s)
              </button>
            )}
            {pendingCount.solicitacoes > 0 && (
              <button onClick={() => navigate('/solicitacoes')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-600 dark:text-purple-400 shrink-0">
                <FileText className="w-3.5 h-3.5" />
                {pendingCount.solicitacoes} solicitação(ões)
              </button>
            )}
          </div>
        )}

        {/* Profile Card */}
        <Card className="border-border/50 shadow-xl overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary to-primary/60 dark:from-primary/80 dark:to-primary/30" />
          <CardContent className="relative pt-0 pb-6 -mt-12">
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.nome || ''} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground">{profile?.nome || 'Colaborador'}</h1>
                <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
              </div>

              <Badge variant={roleBadgeVariant[role] || 'outline'} className="gap-1">
                <Shield className="w-3 h-3" />
                {roleLabel[role] || 'Colaborador'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickAccessItems.map((item) => (
              <QuickAccessCard
                key={item.path}
                item={item}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </div>

        {/* Dashboard Charts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Dashboard
          </h2>
          <HoursChart />
          <SalaryChart />
          <GoalsProgress />
        </div>


        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Informações Profissionais
            </h2>
          </CardHeader>
          <CardContent className="space-y-1">
            {profile?.cargo && (
              <ProfileInfoItem icon={Briefcase} label="Cargo" value={profile.cargo} />
            )}
            {profile?.departamento && (
              <ProfileInfoItem icon={Building2} label="Departamento" value={profile.departamento} />
            )}
            {profile?.matricula && (
              <ProfileInfoItem icon={Hash} label="Matrícula" value={profile.matricula} />
            )}
            {profile?.data_admissao && (
              <ProfileInfoItem icon={Calendar} label="Data de Admissão" value={formatDate(profile.data_admissao)!} />
            )}
            {!profile?.cargo && !profile?.departamento && !profile?.matricula && !profile?.data_admissao && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma informação profissional cadastrada ainda.
              </p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
    </PullToRefresh>
  );
}
