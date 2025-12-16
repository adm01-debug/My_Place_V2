import { 
  User, Wallet, Clock, Umbrella, CreditCard, Gift, BookOpen, 
  FileText, MessageSquare, Bell, HelpCircle, LogOut, ChevronRight 
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
    <Card className="p-4 hover:bg-muted/50 transition-colors active:scale-[0.98]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center bg-muted', color)}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
      { icon: Wallet, label: 'Remuneração Variável', to: '/variavel', color: 'text-finance' },
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
      <div className="space-y-6 animate-fade-in-up">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item) => (
                <MenuItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <Card className="p-4 border-destructive/30 hover:bg-destructive/5 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-destructive/10">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <span className="font-medium text-destructive">Sair</span>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
