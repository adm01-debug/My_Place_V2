import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import { 
  type UserRole, 
  type PermissionAction, 
  type ResourceType, 
  ROLE_PERMISSIONS, 
  ROUTE_ACCESS 
} from './auth-permissions';

const log = createLogger('AuthContext');

// Re-export types for consumers
export type { UserRole, PermissionAction, ResourceType };

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

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

interface LockoutInfo {
  isLocked: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  remainingAttempts: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isGestor: boolean;
  isRH: boolean;
  isDiretor: boolean;
  hasPermission: (action: PermissionAction, resource: ResourceType) => boolean;
  canAccess: (route: string) => boolean;
  hasAnyRole: (...roles: UserRole[]) => boolean;
  sessionExpiresAt: Date | null;
  isSessionExpiringSoon: boolean;
  refreshSession: () => Promise<void>;
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
  const [dbRole, setDbRole] = useState<'admin' | 'gestor' | 'user' | null>(null);

  // ============================================================================
  // ROLE DETECTION
  // ============================================================================

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        log.error('Erro ao buscar roles:', error);
        setDbRole(null);
        return;
      }

      const roles = (data ?? []).map(r => r.role);
      if (roles.includes('admin')) {
        setDbRole('admin');
      } else if (roles.includes('gestor')) {
        setDbRole('gestor');
      } else {
        setDbRole('user');
      }
    } catch (error) {
      log.error('Erro ao buscar roles:', error);
      setDbRole(null);
    }
  }, []);

  const detectRole = useCallback((profile: Profile | null): UserRole => {
    if (!profile) return 'colaborador';
    if (dbRole === 'admin') return 'admin';
    if (dbRole === 'gestor') return 'gestor';
    return 'colaborador';
  }, [dbRole]);

  const role = useMemo(() => detectRole(profile), [profile, detectRole]);

  const isAdmin = role === 'admin';
  const isGestor = role === 'gestor' || role === 'admin' || role === 'diretor';
  const isRH = role === 'rh' || role === 'admin';
  const isDiretor = role === 'diretor';

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  const hasPermission = useCallback((action: PermissionAction, resource: ResourceType): boolean => {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;
    return resourcePermission.actions.includes(action);
  }, [role]);

  const canAccess = useCallback((route: string): boolean => {
    const allowedRoles = ROUTE_ACCESS[route];
    if (allowedRoles) return allowedRoles.includes(role);
    return true;
  }, [role]);

  const hasAnyRole = useCallback((...roles: UserRole[]): boolean => {
    return roles.includes(role);
  }, [role]);

  // ============================================================================
  // SESSION MANAGEMENT
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
        log.error('Erro ao renovar sessão:', error);
        return;
      }
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }
    } catch (error) {
      log.error('Erro ao renovar sessão:', error);
    }
  }, []);

  useEffect(() => {
    if (!session?.expires_at) return;
    const expiresAt = session.expires_at * 1000;
    const refreshTime = expiresAt - 2 * 60 * 1000;
    const now = Date.now();

    if (refreshTime <= now) {
      refreshSession();
      return;
    }

    const timeout = setTimeout(() => {
      refreshSession();
    }, refreshTime - now);

    return () => clearTimeout(timeout);
  }, [session?.expires_at, refreshSession]);

  // ============================================================================
  // PROFILE
  // ============================================================================

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        log.error('Erro ao buscar perfil:', error);
        return null;
      }
      return data;
    } catch (error) {
      log.error('Erro ao buscar perfil:', error);
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
  // AUTHENTICATION
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
      log.error('Erro ao verificar bloqueio:', error);
      return { isLocked: false, failedAttempts: 0, lockedUntil: null, remainingAttempts: MAX_ATTEMPTS };
    }
  }, []);

  const recordLoginAttempt = useCallback(async (email: string, success: boolean) => {
    try {
      await supabase.rpc('record_login_attempt', { p_email: email, p_success: success, p_ip_address: undefined });
    } catch (error) {
      log.error('Erro ao registrar tentativa:', error);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; lockoutInfo?: LockoutInfo }> => {
    try {
      setIsLoading(true);
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

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        await recordLoginAttempt(email, false);
        const updatedLockout = await checkAccountLocked(email);
        let errorMsg = 'Credenciais inválidas';
        if (error.message?.includes('Invalid login')) {
          errorMsg = `Email ou senha incorretos. ${updatedLockout.remainingAttempts} tentativa${updatedLockout.remainingAttempts !== 1 ? 's' : ''} restante${updatedLockout.remainingAttempts !== 1 ? 's' : ''}`;
        } else if (error.message?.includes('Email not confirmed')) {
          errorMsg = 'Email não verificado. Verifique sua caixa de entrada';
        }
        return { success: false, error: errorMsg, lockoutInfo: updatedLockout };
      }

      await recordLoginAttempt(email, true);

      if (data.user) {
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
        await fetchUserRole(data.user.id);
      }

      return { success: true };
    } catch (error) {
      log.error('Erro no login:', error);
      return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  }, [checkAccountLocked, recordLoginAttempt, fetchProfile, fetchUserRole]);

  const signUp = useCallback(async (email: string, password: string, nome: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome } },
      });

      if (error) {
        let errorMsg = 'Erro ao criar conta';
        if (error.message?.includes('already registered')) {
          errorMsg = 'Este email já está cadastrado';
        } else if (error.message?.includes('weak_password')) {
          errorMsg = 'Senha muito fraca. Use pelo menos 8 caracteres';
        }
        return { success: false, error: errorMsg };
      }

      if (data.user && !data.session) {
        return { success: true, error: 'Verifique seu email para confirmar o cadastro' };
      }

      return { success: true };
    } catch (error) {
      log.error('Erro no cadastro:', error);
      return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setDbRole(null);
    } catch (error) {
      log.error('Erro ao sair:', error);
    }
  }, []);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user && mounted) {
          setSession(currentSession);
          setUser(currentSession.user);

          const profileData = await fetchProfile(currentSession.user.id);
          if (mounted) {
            setProfile(profileData);
            await fetchUserRole(currentSession.user.id);
          }
        }
      } catch (error) {
        log.error('Erro ao inicializar auth:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        log.info(`Auth event: ${event}`);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id);
          if (mounted) {
            setProfile(profileData);
            await fetchUserRole(newSession.user.id);
          }
        }

        if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          // Silently update session without reloading profile
          log.info('Token refreshed successfully');
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setDbRole(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchUserRole]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isAuthenticated: !!session && !!user,
      isLoading,
      role,
      isAdmin,
      isGestor,
      isRH,
      isDiretor,
      hasPermission,
      canAccess,
      hasAnyRole,
      sessionExpiresAt,
      isSessionExpiringSoon,
      refreshSession,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      checkAccountLocked,
    }),
    [
      user, session, profile, isLoading, role,
      isAdmin, isGestor, isRH, isDiretor,
      hasPermission, canAccess, hasAnyRole,
      sessionExpiresAt, isSessionExpiringSoon,
      refreshSession, signIn, signUp, signOut,
      refreshProfile, checkAccountLocked,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
