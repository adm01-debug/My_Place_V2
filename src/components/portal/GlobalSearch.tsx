import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, FileText, DollarSign, Umbrella, Clock, 
  GraduationCap, CreditCard, Bell, User, MessageSquare,
  Heart, Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon: any;
  route: string;
  keywords: string[];
}

const menuItems: SearchResult[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Página inicial com resumo',
    category: 'Páginas',
    icon: User,
    route: '/dashboard',
    keywords: ['home', 'início', 'resumo', 'painel'],
  },
  {
    id: 'ponto',
    title: 'Meu Ponto',
    description: 'Registros de ponto e banco de horas',
    category: 'Páginas',
    icon: Clock,
    route: '/ponto',
    keywords: ['hora', 'registro', 'entrada', 'saída', 'banco de horas', 'espelho'],
  },
  {
    id: 'holerites',
    title: 'Holerites',
    description: 'Demonstrativos de pagamento',
    category: 'Páginas',
    icon: DollarSign,
    route: '/holerites',
    keywords: ['salário', 'pagamento', 'contracheque', 'recibo', 'demonstrativo'],
  },
  {
    id: 'ferias',
    title: 'Férias',
    description: 'Solicitar e acompanhar férias',
    category: 'Páginas',
    icon: Umbrella,
    route: '/ferias',
    keywords: ['descanso', 'folga', 'abono', 'recesso'],
  },
  {
    id: 'beneficios',
    title: 'Benefícios',
    description: 'Plano de saúde, vale, etc.',
    category: 'Páginas',
    icon: Heart,
    route: '/beneficios',
    keywords: ['plano de saúde', 'dental', 'vale refeição', 'vale transporte', 'auxílio'],
  },
  {
    id: 'emprestimos',
    title: 'Empréstimos',
    description: 'Empréstimo consignado',
    category: 'Páginas',
    icon: CreditCard,
    route: '/emprestimos',
    keywords: ['consignado', 'crédito', 'parcela', 'dívida'],
  },
  {
    id: 'treinamentos',
    title: 'Treinamentos',
    description: 'Cursos e capacitações',
    category: 'Páginas',
    icon: GraduationCap,
    route: '/treinamentos',
    keywords: ['curso', 'capacitação', 'aprendizado', 'certificado'],
  },
  {
    id: 'comunicados',
    title: 'Comunicados',
    description: 'Avisos e notícias',
    category: 'Páginas',
    icon: MessageSquare,
    route: '/comunicados',
    keywords: ['aviso', 'notícia', 'informação', 'anúncio'],
  },
  {
    id: 'documentos',
    title: 'Documentos',
    description: 'Documentos pessoais e profissionais',
    category: 'Páginas',
    icon: FileText,
    route: '/documentos',
    keywords: ['arquivo', 'contrato', 'informe', 'rendimentos'],
  },
  {
    id: 'solicitacoes',
    title: 'Solicitações',
    description: 'Minhas solicitações ao RH',
    category: 'Páginas',
    icon: Bell,
    route: '/solicitacoes',
    keywords: ['pedido', 'requisição', 'chamado', 'ticket'],
  },
  {
    id: 'perfil',
    title: 'Meu Perfil',
    description: 'Dados pessoais e configurações',
    category: 'Páginas',
    icon: User,
    route: '/perfil',
    keywords: ['dados', 'cadastro', 'informações', 'conta', 'senha'],
  },
  {
    id: 'variavel',
    title: 'Remuneração Variável',
    description: 'Comissões, bônus e metas',
    category: 'Páginas',
    icon: DollarSign,
    route: '/variavel',
    keywords: ['comissão', 'bônus', 'meta', 'prêmio', 'variável'],
  },
];

const quickActions: SearchResult[] = [
  {
    id: 'registrar-ponto',
    title: 'Registrar Ponto',
    description: 'Bater ponto agora',
    category: 'Ações Rápidas',
    icon: Clock,
    route: '/ponto',
    keywords: ['bater ponto', 'marcar', 'entrada', 'saída'],
  },
  {
    id: 'solicitar-ferias',
    title: 'Solicitar Férias',
    description: 'Fazer solicitação de férias',
    category: 'Ações Rápidas',
    icon: Umbrella,
    route: '/ferias',
    keywords: ['pedir férias', 'agendar'],
  },
  {
    id: 'ver-holerite',
    title: 'Ver Último Holerite',
    description: 'Acessar holerite mais recente',
    category: 'Ações Rápidas',
    icon: DollarSign,
    route: '/holerites',
    keywords: ['salário', 'pagamento'],
  },
  {
    id: 'abrir-chamado',
    title: 'Abrir Chamado',
    description: 'Nova solicitação ao RH',
    category: 'Ações Rápidas',
    icon: Bell,
    route: '/solicitacoes',
    keywords: ['ajuda', 'suporte', 'ticket'],
  },
];

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (route: string) => {
    setOpen(false);
    navigate(route);
  };

  return (
    <>
      <Button
        variant="outline"
        className={`relative w-full justify-start text-muted-foreground ${className}`}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline-flex">Buscar...</span>
        <span className="sm:hidden">Buscar</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="O que você procura?" />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum resultado encontrado.
              </p>
            </div>
          </CommandEmpty>

          <CommandGroup heading="Ações Rápidas">
            {quickActions.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.keywords.join(' ')}`}
                onSelect={() => handleSelect(item.route)}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Páginas">
            {menuItems.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.keywords.join(' ')}`}
                onSelect={() => handleSelect(item.route)}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Compact version for header
export function GlobalSearchButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (route: string) => {
    setOpen(false);
    navigate(route);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar no portal..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Ações Rápidas">
            {quickActions.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.keywords.join(' ')}`}
                onSelect={() => handleSelect(item.route)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Páginas">
            {menuItems.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.keywords.join(' ')}`}
                onSelect={() => handleSelect(item.route)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
