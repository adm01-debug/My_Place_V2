// Camada de serviços API
import { supabase } from '@/integrations/supabase/client';

export class ApiService {
  static async get<T>(table: string, query?: Record<string, any>): Promise<T[]> {
    let q = supabase.from(table).select('*');
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        q = q.eq(key, value);
      });
    }
    const { data, error } = await q;
    if (error) throw error;
    return data as T[];
  }

  static async getById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data as T;
  }

  static async create<T>(table: string, item: Partial<T>): Promise<T> {
    const { data, error } = await supabase.from(table).insert(item).select().single();
    if (error) throw error;
    return data as T;
  }

  static async update<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as T;
  }

  static async delete(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }

  static async softDelete(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }

  static async restore(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id);
    if (error) throw error;
  }

  static async callFunction<T>(functionName: string, params?: Record<string, any>): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, { body: params });
    if (error) throw error;
    return data as T;
  }
}

export default ApiService;
