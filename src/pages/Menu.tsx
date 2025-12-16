import { 
  User, Wallet, Clock, Umbrella, CreditCard, Gift, BookOpen, 
  FileText, MessageSquare, Bell, HelpCircle, LogOut, ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/portal/PageLayout';
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
    ],
  },
  {
    title: 'Desenvolvimento',
    items: [
      { icon: BookOpen, label: 'Meus Treinamentos', to: '/treinamentos', color: 'text-finance', badge: '2' },
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
      { icon: HelpCircle, label: 'Ajuda e FAQ', to: '/ajuda', color: 'text-muted-foreground' },
    ],
  },
];

export default function Menu() {
  return (
    <PageLayout title="Menu">
      <div className="space-y-6">
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
          <Card className="p-4 border-destructive/20 hover:bg-destructive/5 transition-all duration-300 cursor-pointer hover-lift shadow-card bg-card/80 backdrop-blur-sm group">
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
