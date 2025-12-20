import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'gestor' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

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
      .from('user_roles' as any)
      .select('*')
      .eq('user_id', user.id) as { data: any[] | null; error: any };

    if (error) {
      console.error('Error fetching user roles:', error);
      setIsLoading(false);
      return;
    }

    const userRoles = (data || []) as UserRole[];
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
