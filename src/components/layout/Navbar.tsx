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
import { Building2, Home, User, LogOut, Clock, Palmtree, Receipt, FileText, MapPin, ClipboardCheck } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { GlobalSearch } from './GlobalSearch';

const navItems = [
  { label: 'Início', path: '/', icon: Home },
  { label: 'Ponto', path: '/ponto', icon: Clock },
  { label: 'Férias', path: '/ferias', icon: Palmtree },
  { label: 'Holerites', path: '/holerites', icon: Receipt },
  { label: 'Solicitações', path: '/solicitacoes', icon: FileText },
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60">
      <div className="w-full max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold hidden sm:inline">Portal do Colaborador</span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={`gap-1.5 text-xs font-medium ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Notification Bell + User Menu */}
        <div className="flex items-center gap-1.5">
          <GlobalSearch />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.nome || ''} />
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground truncate">{profile?.nome || 'Colaborador'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')} className="gap-2 cursor-pointer">
                <User className="w-4 h-4" />
                Meu Perfil
              </DropdownMenuItem>
              {hasAdminAccess && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/aprovacoes')} className="gap-2 cursor-pointer">
                    <ClipboardCheck className="w-4 h-4" />
                    Aprovações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/locais')} className="gap-2 cursor-pointer">
                    <MapPin className="w-4 h-4" />
                    Locais Permitidos
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-lg safe-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
