import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Home, Clock, Palmtree, Receipt, FileText, User, MapPin, ClipboardCheck, Search, Shield, Settings, Users, BarChart3, Bell, LogIn, Coffee, DoorOpen, LogOut } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';

const pages = [
  { label: 'Início', path: '/', icon: Home, keywords: 'home dashboard início overview' },
  { label: 'Ponto', path: '/ponto', icon: Clock, keywords: 'ponto registro clock time jornada' },
  { label: 'Férias', path: '/ferias', icon: Palmtree, keywords: 'férias vacation descanso folga' },
  { label: 'Holerites', path: '/holerites', icon: Receipt, keywords: 'holerites salário pagamento contracheque recibo' },
  { label: 'Solicitações', path: '/solicitacoes', icon: FileText, keywords: 'solicitações pedidos requests rh' },
  { label: 'Meu Perfil', path: '/perfil', icon: User, keywords: 'perfil profile conta settings configurações' },
];

const adminPages = [
  { label: 'Aprovações', path: '/admin/aprovacoes', icon: ClipboardCheck, keywords: 'aprovações admin gestão requests' },
  { label: 'Usuários', path: '/admin/usuarios', icon: Users, keywords: 'usuários users colaboradores admin' },
  { label: 'Dashboard Admin', path: '/admin', icon: BarChart3, keywords: 'dashboard admin estatísticas metrics' },
  { label: 'Locais Permitidos', path: '/admin/locais', icon: MapPin, keywords: 'locais admin mapa geofence' },
  { label: 'Relatórios', path: '/admin/relatorios', icon: FileText, keywords: 'relatórios reports excel csv export' },
  { label: 'Configurações do Sistema', path: '/admin/configuracoes', icon: Settings, keywords: 'configurações settings system admin' },
];

const quickActions = [
  { label: 'Registrar Entrada', action: 'punch-entrada', icon: LogIn, keywords: 'entrada bater ponto start' },
  { label: 'Sair para Almoço', action: 'punch-almoco', icon: Coffee, keywords: 'almoço pause break' },
  { label: 'Retornar do Almoço', action: 'punch-retorno', icon: DoorOpen, keywords: 'retorno volta back lunch' },
  { label: 'Registrar Saída', action: 'punch-saida', icon: LogOut, keywords: 'saída bater ponto end finish' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, isGestor } = useUserRoles();
  const hasAdminAccess = isAdmin || isGestor;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/30 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Buscar...</span>
        <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border/50">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar página ou ação..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Páginas">
            {pages.map(page => (
              <CommandItem
                key={page.path}
                value={page.label + ' ' + page.keywords}
                onSelect={() => handleSelect(page.path)}
                className="gap-3 cursor-pointer"
              >
                <page.icon className="w-4 h-4 text-muted-foreground" />
                <span>{page.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          {hasAdminAccess && (
            <CommandGroup heading="Administração">
              {adminPages.map(page => (
                <CommandItem
                  key={page.path}
                  value={page.label + ' ' + page.keywords}
                  onSelect={() => handleSelect(page.path)}
                  className="gap-3 cursor-pointer"
                >
                  <page.icon className="w-4 h-4 text-muted-foreground" />
                  <span>{page.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
