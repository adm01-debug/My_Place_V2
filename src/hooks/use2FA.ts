import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/lib/logger';

const log = createLogger('2FA');

interface TwoFAStatus {
  enabled: boolean;
  verifiedAt: string | null;
  backupCodesRemaining: number;
}

interface SetupResponse {
  success: boolean;
  secret?: string;
  otpauthUrl?: string;
  backupCodes?: string[];
  error?: string;
}

interface VerifyResponse {
  success: boolean;
  valid?: boolean;
  error?: string;
  usedBackupCode?: boolean;
}

export function use2FA() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<TwoFAStatus | null>(null);

  const fetchStatus = useCallback(async (): Promise<TwoFAStatus | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'status' }
      });
      
      if (error) {
        log.error('Error fetching 2FA status:', error);
        return null;
      }
      
      setStatus(data);
      return data;
    } catch (error) {
      log.error('Error fetching 2FA status:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const setup = useCallback(async (): Promise<SetupResponse> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'setup' }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.error) {
        return { success: false, error: data.error };
      }
      
      return {
        success: true,
        secret: data.secret,
        otpauthUrl: data.otpauthUrl,
        backupCodes: data.backupCodes,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const verifySetup = useCallback(async (code: string): Promise<VerifyResponse> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'verify-setup', code }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.error) {
        return { success: false, valid: false, error: data.error };
      }
      
      await fetchStatus();
      return { success: true, valid: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchStatus]);

  const verify = useCallback(async (code: string, isBackupCode = false): Promise<VerifyResponse> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };
    
    setIsLoading(true);
    try {
      const body = isBackupCode 
        ? { action: 'verify', backupCode: code }
        : { action: 'verify', code };
      
      const { data, error } = await supabase.functions.invoke('totp-2fa', { body });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.error) {
        return { success: false, valid: false, error: data.error };
      }
      
      return { 
        success: data.valid, 
        valid: data.valid,
        usedBackupCode: data.usedBackupCode 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const disable = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'disable', code }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.error) {
        return { success: false, error: data.error };
      }
      
      setStatus({ enabled: false, verifiedAt: null, backupCodesRemaining: 0 });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const regenerateBackupCodes = useCallback(async (code: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'regenerate-backup', code }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.error) {
        return { success: false, error: data.error };
      }
      
      await fetchStatus();
      return { success: true, backupCodes: data.backupCodes };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchStatus]);

  return {
    isLoading,
    status,
    fetchStatus,
    setup,
    verifySetup,
    verify,
    disable,
    regenerateBackupCodes,
  };
}
