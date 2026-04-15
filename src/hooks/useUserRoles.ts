import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('rRoles');

type AppRole = Database['public']['Enums']['app_role'];
type UserRoleRow = Database['public']['Tables']['user_roles']['Row'];

interface UserRole extends UserRoleRow {}

export function useUserRoles() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGestor, setIsGestor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setIsAdmin(false);
      setIsGestor(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      log.error('Error fetching user roles:', error);
      setIsLoading(false);
      return;
    }

    const userRoles = data ?? [];
    setRoles(userRoles);
    setIsAdmin(userRoles.some(r => r.role === 'admin'));
    setIsGestor(userRoles.some(r => r.role === 'gestor'));
    setIsLoading(false);
  }, [user]);

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.some(r => r.role === role);
  }, [roles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    isAdmin,
    isGestor,
    isLoading,
    hasRole,
    refetch: fetchRoles,
  };
}
