import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type UserRole = 'colaborador' | 'gestor' | 'rh' | 'admin' | 'diretor';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  departamento: string | null;
  data_admissao: string | null;
  matricula: string | null;
  avatar_url: string | null;
  cpf?: string | null;
  telefone?: string | null;
  is_admin?: boolean;
  is_gestor?: boolean;
  gestor_id?: string | null;
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export type ResourceType = 
  | 'dashboard'
  | 'ponto'
  | 'ferias'
  | 'holerites'
  | 'beneficios'
  | 'treinamentos'
  | 'documentos'
  | 'comunicados'
  | 'emprestimos'
  | 'metas'
  | 'feedback'
  | 'pesquisas'
  | 'organograma'
  | 'calendario'
  | 'solicitacoes'
  | 'admin'
  | 'gestao'
  | 'relatorios'
  | 'usuarios'
  | 'configuracoes';

interface Permission {
  resource: ResourceType;
  actions: PermissionAction[];
}

// ============================================================================
// PERMISSÕES POR ROLE
// ============================================================================

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  colaborador: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'create'] },
    { resource: 'ferias', actions: ['view', 'create'] },
    { resource: 'holerites', actions: ['view', 'export'] },
    { resource: 'beneficios', actions: ['view'] },
    { resource: 'treinamentos', actions: ['view'] },
    { resource: 'documentos', actions: ['view'] },
    { resource: 'comunicados', actions: ['view'] },
    { resource: 'emprestimos', actions: ['view', 'create'] },
    { resource: 'metas', actions: ['view'] },
    { resource: 'feedback', actions: ['view', 'create'] },
    { resource: 'pesquisas', actions: ['view', 'create'] },
    { resource: 'organograma', actions: ['view'] },
    { resource: 'calendario', actions: ['view'] },
    { resource: 'solicitacoes', actions: ['view', 'create'] },
  ],
  gestor: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'create', 'approve'] },
    { resource: 'ferias', actions: ['view', 'create', 'approve'] },
    { resource: 'holerites', actions: ['view', 'export'] },
    { resource: 'beneficios', actions: ['view'] },
    { resource: 'treinamentos', actions: ['view', 'create'] },
    { resource: 'documentos', actions: ['view'] },
    { resource: 'comunicados', actions: ['view', 'create'] },
    { resource: 'emprestimos', actions: ['view', 'create', 'approve'] },
    { resource: 'metas', actions: ['view', 'create', 'edit'] },
    { resource: 'feedback', actions: ['view', 'create'] },
    { resource: 'pesquisas', actions: ['view', 'create'] },
    { resource: 'organograma', actions: ['view'] },
    { resource: 'calendario', actions: ['view', 'create'] },
    { resource: 'solicitacoes', actions: ['view', 'create', 'approve'] },
    { resource: 'gestao', actions: ['view'] },
    { resource: 'relatorios', actions: ['view', 'export'] },
  ],
  rh: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'create', 'edit', 'approve', 'export'] },
    { resource: 'ferias', actions: ['view', 'create', 'edit', 'approve', 'export'] },
    { resource: 'holerites', actions: ['view', 'create', 'edit', 'export'] },
    { resource: 'beneficios', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'treinamentos', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'documentos', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'comunicados', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'emprestimos', actions: ['view', 'create', 'edit', 'approve', 'export'] },
    { resource: 'metas', actions: ['view', 'create', 'edit'] },
    { resource: 'feedback', actions: ['view', 'create', 'edit'] },
    { resource: 'pesquisas', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'organograma', actions: ['view', 'edit'] },
    { resource: 'calendario', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'solicitacoes', actions: ['view', 'create', 'edit', 'approve'] },
    { resource: 'gestao', actions: ['view'] },
    { resource: 'relatorios', actions: ['view', 'export'] },
    { resource: 'usuarios', actions: ['view', 'edit'] },
  ],
  admin: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { resource: 'ferias', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { resource: 'holerites', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { resource: 'beneficios', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'treinamentos', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'documentos', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'comunicados', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'emprestimos', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { resource: 'metas', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'feedback', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'pesquisas', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'organograma', actions: ['view', 'edit'] },
    { resource: 'calendario', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'solicitacoes', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
    { resource: 'admin', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'gestao', actions: ['view'] },
    { resource: 'relatorios', actions: ['view', 'export'] },
    { resource: 'usuarios', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'configuracoes', actions: ['view', 'edit'] },
  ],
  diretor: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'approve', 'export'] },
    { resource: 'ferias', actions: ['view', 'approve', 'export'] },
    { resource: 'holerites', actions: ['view', 'export'] },
    { resource: 'beneficios', actions: ['view'] },
    { resource: 'treinamentos', actions: ['view'] },
    { resource: 'documentos', actions: ['view'] },
    { resource: 'comunicados', actions: ['view', 'create'] },
    { resource: 'emprestimos', actions: ['view', 'approve', 'export'] },
    { resource: 'metas', actions: ['view', 'create', 'edit', 'approve'] },
    { resource: 'feedback', actions: ['view'] },
    { resource: 'pesquisas', actions: ['view'] },
    { resource: 'organograma', actions: ['view'] },
    { resource: 'calendario', actions: ['view'] },
    { resource: 'solicitacoes', actions: ['view', 'approve'] },
    { resource: 'admin', actions: ['view'] },
    { resource: 'gestao', actions: ['view'] },
    { resource: 'relatorios', actions: ['view', 'export'] },
    { resource: 'usuarios', actions: ['view'] },
    { resource: 'configuracoes', actions: ['view'] },
  ],
};

// Rotas protegidas por role
const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/admin': ['admin', 'rh'],
  '/gestao': ['gestor', 'rh', 'admin', 'diretor'],
  '/relatorios': ['gestor', 'rh', 'admin', 'diretor'],
  '/configuracoes': ['admin'],
  '/usuarios': ['rh', 'admin'],
};

// ============================================================================
// INTERFACE DO CONTEXTO
// ============================================================================

interface LockoutInfo {
  isLocked: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  remainingAttempts: number;
}

interface AuthContextType {
  // Estado básico
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Role e permissões
  role: UserRole;
  isAdmin: boolean;
  isGestor: boolean;
  isRH: boolean;
  isDiretor: boolean;
  
  // Funções de verificação de permissão
  hasPermission: (action: PermissionAction, resource: ResourceType) => boolean;
  canAccess: (route: string) => boolean;
  hasAnyRole: (...roles: UserRole[]) => boolean;
  
  // Gestão de sessão
  sessionExpiresAt: Date | null;
  isSessionExpiringSoon: boolean;
  refreshSession: () => Promise<void>;
  
  // Autenticação
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; lockoutInfo?: LockoutInfo }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkAccountLocked: (email: string) => Promise<LockoutInfo>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // DETECÇÃO DE ROLE
  // ============================================================================

  // ============================================================================
  // DETECÇÃO DE ROLE VIA TABELA user_roles (SERVER-SIDE)
  // ============================================================================

  const [dbRole, setDbRole] = useState<'admin' | 'gestor' | 'user' | null>(null);

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao buscar roles:', error);
        setDbRole(null);
        return;
      }

      // Priorizar: admin > gestor > user
      const roles = (data ?? []).map(r => r.role);
      if (roles.includes('admin')) {
        setDbRole('admin');
      } else if (roles.includes('gestor')) {
        setDbRole('gestor');
      } else {
        setDbRole('user');
      }
    } catch (error) {
      console.error('Erro ao buscar roles:', error);
      setDbRole(null);
    }
  }, []);

  const detectRole = useCallback((profile: Profile | null): UserRole => {
    if (!profile) return 'colaborador';

    // 1. Fonte primária: tabela user_roles (segura, server-side)
    if (dbRole === 'admin') return 'admin';
    if (dbRole === 'gestor') return 'gestor';

    // 2. Fallback: flags do perfil (compatibilidade retroativa)
    if (profile.is_admin) return 'admin';
    if (profile.is_gestor) return 'gestor';

    // 3. Último recurso: inferência por cargo (apenas para UX, nunca para segurança)
    const cargo = (profile.cargo || '').toLowerCase();

    if (cargo.includes('diretor') || cargo.includes('ceo') || cargo.includes('presidente')) {
      return 'diretor';
    }
    if (cargo.includes('rh') || cargo.includes('recursos humanos') || cargo.includes('people') || cargo.includes('dp')) {
      return 'rh';
    }
    if (cargo.includes('gerente') || cargo.includes('coordenador') || cargo.includes('supervisor') || cargo.includes('líder') || cargo.includes('lider')) {
      return 'gestor';
    }

    return 'colaborador';
  }, [dbRole]);

  const role = useMemo(() => detectRole(profile), [profile, detectRole]);

  // ============================================================================
  // FLAGS DE CONVENIÊNCIA
  // ============================================================================

  const isAdmin = role === 'admin';
  const isGestor = role === 'gestor' || role === 'admin' || role === 'diretor';
  const isRH = role === 'rh' || role === 'admin';
  const isDiretor = role === 'diretor';

  // ============================================================================
  // VERIFICAÇÃO DE PERMISSÕES
  // ============================================================================

  const hasPermission = useCallback((action: PermissionAction, resource: ResourceType): boolean => {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    
    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;
    
    return resourcePermission.actions.includes(action);
  }, [role]);

  const canAccess = useCallback((route: string): boolean => {
    // Verificar rotas protegidas específicas
    const allowedRoles = ROUTE_ACCESS[route];
    if (allowedRoles) {
      return allowedRoles.includes(role);
    }
    
    // Rotas públicas ou sem restrição específica
    return true;
  }, [role]);

  const hasAnyRole = useCallback((...roles: UserRole[]): boolean => {
    return roles.includes(role);
  }, [role]);

  // ============================================================================
  // GESTÃO DE SESSÃO E TOKEN
  // ============================================================================

  const sessionExpiresAt = useMemo((): Date | null => {
    if (!session?.expires_at) return null;
    return new Date(session.expires_at * 1000);
  }, [session]);

  const isSessionExpiringSoon = useMemo((): boolean => {
    if (!sessionExpiresAt) return false;
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return sessionExpiresAt <= fiveMinutesFromNow;
  }, [sessionExpiresAt]);

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Erro ao renovar sessão:', error);
        return;
      }
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }
    } catch (error) {
      console.error('Erro ao renovar sessão:', error);
    }
  }, []);

  // Auto-refresh 2 minutos antes de expirar
  useEffect(() => {
    if (!session?.expires_at) return;

    const expiresAt = session.expires_at * 1000;
    const refreshTime = expiresAt - 2 * 60 * 1000; // 2 minutos antes
    const now = Date.now();

    if (refreshTime <= now) {
      // Já está perto de expirar, renovar agora
      refreshSession();
      return;
    }

    const timeout = setTimeout(() => {
      refreshSession();
    }, refreshTime - now);

    return () => clearTimeout(timeout);
  }, [session?.expires_at, refreshSession]);

  // ============================================================================
  // FETCH PROFILE
  // ============================================================================

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (user) {
      const data = await fetchProfile(user.id);
      setProfile(data);
    }
  }, [user, fetchProfile]);

  // ============================================================================
  // AUTENTICAÇÃO
  // ============================================================================

  const MAX_ATTEMPTS = 5;

  const checkAccountLocked = useCallback(async (email: string): Promise<LockoutInfo> => {
    try {
      const { data, error } = await supabase.rpc('check_account_locked', { p_email: email });
      
      if (error || !data || data.length === 0) {
        return { isLocked: false, failedAttempts: 0, lockedUntil: null, remainingAttempts: MAX_ATTEMPTS };
      }

      const result = data[0];
      return {
        isLocked: result.is_locked,
        failedAttempts: result.failed_attempts,
        lockedUntil: result.locked_until ? new Date(result.locked_until) : null,
        remainingAttempts: Math.max(0, MAX_ATTEMPTS - result.failed_attempts),
      };
    } catch (error) {
      console.error('Erro ao verificar bloqueio:', error);
      return { isLocked: false, failedAttempts: 0, lockedUntil: null, remainingAttempts: MAX_ATTEMPTS };
    }
  }, []);

  const recordLoginAttempt = useCallback(async (email: string, success: boolean) => {
    try {
      await supabase.rpc('record_login_attempt', { 
        p_email: email, 
        p_success: success,
        p_ip_address: null 
      });
    } catch (error) {
      console.error('Erro ao registrar tentativa:', error);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; lockoutInfo?: LockoutInfo }> => {
    try {
      setIsLoading(true);
      
      // Check if account is locked
      const lockoutInfo = await checkAccountLocked(email);
      if (lockoutInfo.isLocked) {
        const minutesLeft = lockoutInfo.lockedUntil 
          ? Math.ceil((lockoutInfo.lockedUntil.getTime() - Date.now()) / 60000)
          : 15;
        return { 
          success: false, 
          error: `Conta bloqueada por ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''} devido a múltiplas tentativas incorretas`,
          lockoutInfo 
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed attempt
        await recordLoginAttempt(email, false);
        
        // Get updated lockout info
        const updatedLockout = await checkAccountLocked(email);
        
        let errorMessage = error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : error.message;
        
        if (updatedLockout.remainingAttempts > 0 && updatedLockout.remainingAttempts < MAX_ATTEMPTS) {
          errorMessage += `. ${updatedLockout.remainingAttempts} tentativa${updatedLockout.remainingAttempts !== 1 ? 's' : ''} restante${updatedLockout.remainingAttempts !== 1 ? 's' : ''}`;
        }
        
        return { 
          success: false, 
          error: errorMessage,
          lockoutInfo: updatedLockout
        };
      }

      // Record successful login
      await recordLoginAttempt(email, true);

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro ao fazer login' };
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, checkAccountLocked, recordLoginAttempt]);

  const signUp = useCallback(async (email: string, password: string, nome: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { nome },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Criar perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email,
            nome,
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, error: 'Erro ao criar conta' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // INICIALIZAÇÃO
  // ============================================================================

  useEffect(() => {
    // Verificar sessão inicial
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Usar setTimeout para evitar deadlock
          setTimeout(async () => {
            const profileData = await fetchProfile(newSession.user.id);
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ============================================================================
  // VALOR DO CONTEXTO
  // ============================================================================

  const value: AuthContextType = {
    // Estado básico
    user,
    session,
    profile,
    isAuthenticated: !!user,
    isLoading,
    
    // Role e permissões
    role,
    isAdmin,
    isGestor,
    isRH,
    isDiretor,
    
    // Funções de verificação
    hasPermission,
    canAccess,
    hasAnyRole,
    
    // Gestão de sessão
    sessionExpiresAt,
    isSessionExpiringSoon,
    refreshSession,
    
    // Autenticação
    signIn,
    signUp,
    signOut,
    refreshProfile,
    checkAccountLocked,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Hook de conveniência para verificar permissão específica
export const usePermission = (action: PermissionAction, resource: ResourceType): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(action, resource);
};

// Hook de conveniência para verificar acesso a rota
export const useRouteAccess = (route: string): boolean => {
  const { canAccess } = useAuth();
  return canAccess(route);
};

// Hook para verificar se usuário é gestor de outro usuário
export const useIsManagerOf = (userId: string): boolean => {
  const { profile, isGestor } = useAuth();
  if (!isGestor || !profile) return false;
  
  // Implementação simplificada - em produção, buscar do banco
  return profile.id !== userId;
};

export default AuthContext;
