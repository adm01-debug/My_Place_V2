import { 
  User, Wallet, Clock, Umbrella, CreditCard, Gift, BookOpen, 
  FileText, MessageSquare, Bell, HelpCircle, LogOut, ChevronRight,
  TrendingUp, Moon, Sun, Download, Smartphone, Shield, BarChart3, Calculator,
  Network, CalendarDays, Target, Users, Heart
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/portal/PageLayout';
import { MenuItemSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useUserRoles } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  color?: string;
  badge?: string;
}

const MenuItem = ({ icon: Icon, label, to, color = 'text-primary', badge }: MenuItemProps) => (
  <Link to={to}>
    <Card className="p-4 hover:bg-muted/30 transition-all duration-300 hover-lift border-0 shadow-card bg-card/80 backdrop-blur-sm group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
            color.includes('primary') && 'bg-primary/10',
            color.includes('hr') && 'bg-hr/10',
            color.includes('finance') && 'bg-finance/10',
            color.includes('projects') && 'bg-projects/10',
            color.includes('marketing') && 'bg-marketing/10',
            color.includes('muted') && 'bg-muted',
            color.includes('destructive') && 'bg-destructive/10',
          )}>
            <Icon className={cn('w-5 h-5', color)} />
          </div>
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-semibold animate-pulse">
              {badge}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Card>
  </Link>
);

const menuSections = [
  {
    title: 'Meus Dados',
    items: [
      { icon: User, label: 'Meu Perfil', to: '/perfil', color: 'text-primary' },
      { icon: Wallet, label: 'Meus Holerites', to: '/holerites', color: 'text-hr' },
      { icon: Clock, label: 'Meu Ponto', to: '/ponto', color: 'text-primary' },
      { icon: Umbrella, label: 'Minhas Férias', to: '/ferias', color: 'text-projects' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { icon: TrendingUp, label: 'Remuneração Variável', to: '/variavel', color: 'text-finance' },
      { icon: CreditCard, label: 'Empréstimos', to: '/emprestimos', color: 'text-finance' },
      { icon: Gift, label: 'Meus Benefícios', to: '/beneficios', color: 'text-marketing' },
      { icon: Calculator, label: 'Calculadora', to: '/calculadora', color: 'text-primary' },
    ],
  },
  {
    title: 'Desenvolvimento',
    items: [
      { icon: BookOpen, label: 'Meus Treinamentos', to: '/treinamentos', color: 'text-finance', badge: '2' },
      { icon: Target, label: 'Metas & OKRs', to: '/metas', color: 'text-primary' },
      { icon: Users, label: 'Feedback 360°', to: '/feedback', color: 'text-hr' },
    ],
  },
  {
    title: 'Empresa',
    items: [
      { icon: Network, label: 'Organograma', to: '/organograma', color: 'text-hr' },
      { icon: CalendarDays, label: 'Calendário', to: '/calendario', color: 'text-projects' },
      { icon: Heart, label: 'Clima Organizacional', to: '/clima', color: 'text-marketing' },
    ],
  },
  {
    title: 'Serviços',
    items: [
      { icon: FileText, label: 'Meus Documentos', to: '/documentos', color: 'text-muted-foreground' },
      { icon: MessageSquare, label: 'Minhas Solicitações', to: '/solicitacoes', color: 'text-primary' },
      { icon: Bell, label: 'Comunicados', to: '/comunicados', color: 'text-projects' },
    ],
  },
  {
    title: 'Ajuda',
    items: [
      { icon: HelpCircle, label: 'FAQ', to: '/faq', color: 'text-muted-foreground' },
    ],
  },
];

export default function Menu() {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { isAdmin } = useUserRoles();
  const isLoading = useLoadingState(600);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <PageLayout title="Menu">
        <div className="space-y-6">
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <MenuItemSkeleton key={i} />)}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <MenuItemSkeleton key={i} />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Menu">
      <div className="space-y-6">
        {/* PWA Install Banner */}
        {isInstallable && !isInstalled && (
          <div className="animate-fade-in-up">
            <Card className="p-4 border-0 shadow-card bg-gradient-to-r from-primary/10 to-hr/10 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary/20">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground text-sm">Instalar App</span>
                    <span className="text-xs text-muted-foreground">
                      Acesso rápido na tela inicial
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={install} className="gap-2">
                  <Download className="w-4 h-4" />
                  Instalar
                </Button>
              </div>
            </Card>
          </div>
        )}

        {isInstalled && (
          <div className="animate-fade-in-up">
            <Card className="p-3 border-0 shadow-card bg-finance/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-finance text-sm">
                <Smartphone className="w-4 h-4" />
                <span>App instalado com sucesso!</span>
              </div>
            </Card>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <div className="animate-fade-in-up">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-primary" />
            Aparência
          </h3>
          <Card className="p-4 border-0 shadow-card bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary/10 transition-all duration-500">
                  {isDark ? (
                    <Moon className="w-5 h-5 text-primary animate-fade-in-scale" />
                  ) : (
                    <Sun className="w-5 h-5 text-projects animate-fade-in-scale" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Modo Escuro</span>
                  <span className="text-xs text-muted-foreground">
                    {isDark ? 'Ativado' : 'Desativado'}
                  </span>
                </div>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </Card>
        </div>

        {/* Admin/Gestor Panel Links */}
        {isAdmin && (
          <div className="animate-fade-in-up">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-destructive" />
              Administração
            </h3>
            <div className="space-y-2">
              <MenuItem icon={Shield} label="Painel Admin" to="/admin" color="text-destructive" />
              <MenuItem icon={BarChart3} label="Dashboard Gestão" to="/gestao" color="text-hr" />
            </div>
          </div>
        )}

        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className={`animate-fade-in-up stagger-${sectionIndex + 1}`}>
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-primary" />
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, index) => (
                <div key={item.to} className={`stagger-${index + 1}`}>
                  <MenuItem {...item} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="animate-fade-in-up stagger-6">
          <Card 
            className="p-4 border-destructive/20 hover:bg-destructive/5 transition-all duration-300 cursor-pointer hover-lift shadow-card bg-card/80 backdrop-blur-sm group"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-destructive/10 transition-transform duration-300 group-hover:scale-110">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <span className="font-medium text-destructive">Sair</span>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
