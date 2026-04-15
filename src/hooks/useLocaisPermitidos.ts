import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('LocaisPermitidos');

type LocalPermitidoDB = Database['public']['Tables']['locais_permitidos']['Row'];

interface LocalPermitido extends LocalPermitidoDB {
  descricao?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  dias_semana?: number[] | null;
}

interface ValidacaoLocal {
  local_id: string;
  local_nome: string;
  distancia_metros: number;
  dentro_raio: boolean;
}

export function useLocaisPermitidos() {
  const [locais, setLocais] = useState<LocalPermitido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLocais = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('locais_permitidos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      log.error('Error fetching locais:', error);
      toast({
        title: 'Erro ao carregar locais',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setLocais((data || []) as LocalPermitido[]);
    }

    setIsLoading(false);
  };

  // Validar coordenadas usando função do banco
  const validarLocalizacao = async (
    latitude: number,
    longitude: number
  ): Promise<{ valido: boolean; local: ValidacaoLocal | null; todosLocais: ValidacaoLocal[] }> => {
    try {
      const { data, error } = await supabase
        .rpc('fn_validar_localizacao', {
          p_latitude: latitude,
          p_longitude: longitude,
        });

      if (error) {
        log.error('Error validating location:', error);
        // Fallback: validação local
        return validarLocalizacaoLocal(latitude, longitude);
      }

      const resultados = (data || []) as ValidacaoLocal[];
      const localValido = resultados.find(r => r.dentro_raio);

      return {
        valido: !!localValido,
        local: localValido || null,
        todosLocais: resultados,
      };
    } catch (error) {
      log.error('Error calling fn_validar_localizacao:', error);
      return validarLocalizacaoLocal(latitude, longitude);
    }
  };

  // Validação local (fallback)
  const validarLocalizacaoLocal = (
    latitude: number,
    longitude: number
  ): { valido: boolean; local: ValidacaoLocal | null; todosLocais: ValidacaoLocal[] } => {
    const resultados: ValidacaoLocal[] = locais.map(local => {
      // Fórmula de Haversine simplificada
      const R = 6371000; // Raio da Terra em metros
      const dLat = toRad(latitude - local.latitude);
      const dLon = toRad(longitude - local.longitude);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(local.latitude)) * Math.cos(toRad(latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distancia = R * c;

      return {
        local_id: local.id,
        local_nome: local.nome,
        distancia_metros: Math.round(distancia),
        dentro_raio: distancia <= local.raio_metros,
      };
    }).sort((a, b) => a.distancia_metros - b.distancia_metros);

    const localValido = resultados.find(r => r.dentro_raio);

    return {
      valido: !!localValido,
      local: localValido || null,
      todosLocais: resultados,
    };
  };

  const toRad = (deg: number) => deg * (Math.PI / 180);

  // Verificar se está em horário permitido
  const verificarHorarioPermitido = (localId: string): boolean => {
    const local = locais.find(l => l.id === localId);
    if (!local || !local.horario_inicio || !local.horario_fim) {
      return true; // Sem restrição de horário
    }

    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    const diaAtual = agora.getDay();

    // Verificar dia da semana
    if (local.dias_semana && !local.dias_semana.includes(diaAtual)) {
      return false;
    }

    // Verificar horário
    const [hInicio, mInicio] = local.horario_inicio.split(':').map(Number);
    const [hFim, mFim] = local.horario_fim.split(':').map(Number);
    const minInicio = hInicio * 60 + mInicio;
    const minFim = hFim * 60 + mFim;

    return horaAtual >= minInicio && horaAtual <= minFim;
  };

  const getLocalMaisProximo = (
    latitude: number,
    longitude: number
  ): LocalPermitido | null => {
    if (locais.length === 0) return null;

    let maisProximo = locais[0];
    let menorDistancia = Infinity;

    locais.forEach(local => {
      const distancia = Math.sqrt(
        Math.pow(latitude - local.latitude, 2) +
        Math.pow(longitude - local.longitude, 2)
      ) * 111000; // Aproximação em metros

      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisProximo = local;
      }
    });

    return maisProximo;
  };

  useEffect(() => {
    fetchLocais();
  }, []);

  return {
    locais,
    isLoading,
    validarLocalizacao,
    verificarHorarioPermitido,
    getLocalMaisProximo,
    refetch: fetchLocais,
  };
}
