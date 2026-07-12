import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Home, User, LogOut, Clock, Palmtree, Receipt, FileText, MapPin, ClipboardCheck, Users, FileUp, FileSpreadsheet, LayoutDashboard, Settings, ChevronLeft } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { BackButton } from './BackButton';

const navItems = [
  { label: 'Início', path: '/', icon: Home },
  { label: 'Ponto', path: '/ponto', icon: Clock },
  { label: 'Férias', path: '/ferias', icon: Palmtree },
  { label: 'Holerites', path: '/holerites', icon: Receipt },
  { label: 'Vales', path: '/vales', icon: Receipt },
  { label: 'Solicitações', path: '/solicitacoes', icon: FileText },
  { label: 'Documentos', path: '/documentos', icon: FileText },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isAdmin, isGestor } = useUserRoles();
  const hasAdminAccess = isAdmin || isGestor;

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header role="banner" className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60">
      <div className="w-full max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo and Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold hidden sm:inline tracking-tight">Portal do Colaborador</span>
          </button>
          
          <div className="hidden md:block border-l border-border/50 h-6 mx-1" />
          
          <div className="hidden md:flex items-center">
            <BackButton />
          </div>
        </div>

        {/* Desktop Nav */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(item.path)}
                className={`gap-1.5 text-xs font-medium h-9 rounded-md transition-all active:scale-95 ${
                  isActive
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Notification Bell + User Menu */}
        <div className="flex items-center gap-1">
          <GlobalSearch />
          <ThemeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent active:scale-95 transition-transform">
                <Avatar className="w-8 h-8 border border-border/50 shadow-sm">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.nome || ''} />
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 animate-in fade-in zoom-in duration-200">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground truncate">{profile?.nome || 'Colaborador'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')} className="gap-2 cursor-pointer focus:bg-accent">
                <User className="w-4 h-4" />
                Meu Perfil
              </DropdownMenuItem>
              {hasAdminAccess && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer focus:bg-accent">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/aprovacoes')} className="gap-2 cursor-pointer focus:bg-accent">
                    <ClipboardCheck className="w-4 h-4" />
                    Aprovações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/usuarios')} className="gap-2 cursor-pointer focus:bg-accent">
                    <Users className="w-4 h-4" />
                    Gestão de Usuários
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/holerites')} className="gap-2 cursor-pointer focus:bg-accent">
                    <FileUp className="w-4 h-4" />
                    Importar Holerites
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/relatorios')} className="gap-2 cursor-pointer focus:bg-accent">
                    <FileSpreadsheet className="w-4 h-4" />
                    Relatórios Gerenciais
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/bi')} className="gap-2 cursor-pointer focus:bg-accent">
                    <FileSpreadsheet className="w-4 h-4" />
                    Business Intelligence
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/configuracoes')} className="gap-2 cursor-pointer focus:bg-accent">
                    <Settings className="w-4 h-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/locais')} className="gap-2 cursor-pointer focus:bg-accent">
                    <MapPin className="w-4 h-4" />
                    Locais Permitidos
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Bottom Nav - Optimized with Horizontal Scroll if needed */}
      <nav aria-label="Navegação mobile" className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-lg shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-1 h-16 px-2 safe-area-pb overflow-x-auto no-scrollbar scroll-smooth">
          {/* Mobile Back Button (only shown when not on home) */}
          {location.pathname !== '/' && (
            <button
              onClick={() => navigate(-1)}
              className="flex flex-col items-center justify-center min-w-[64px] h-full gap-1 text-muted-foreground active:scale-90 transition-all shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Voltar</span>
            </button>
          )}

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-w-[64px] h-full gap-1 rounded-lg transition-all active:scale-90 shrink-0 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
