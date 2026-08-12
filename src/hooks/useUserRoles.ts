import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export function useUserRoles() {
  const { role, isLoading, refreshProfile } = useAuth();

  return {
    role,
    isAdmin: role === 'admin',
    isGestor: role === 'gestor' || role === 'admin' || role === 'diretor',
    isRH: role === 'rh' || role === 'admin',
    isDiretor: role === 'diretor',
    isLoading,
    refetch: refreshProfile,
  };
}
