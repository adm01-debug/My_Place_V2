import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, isSameDay, parseISO, isWithinInterval } from 'date-fns';

export interface EventoCalendario {
  id: string;
  titulo: string;
  descricao?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  tipo: 'evento' | 'feriado' | 'aniversario' | 'ferias' | 'confraternizacao' | 'treinamento';
  cor: string;
  local?: string | null;
  online?: boolean | null;
  link_reuniao?: string | null;
  colaborador_nome?: string;
  colaborador_avatar?: string | null;
}

export function useCalendarioCorporativo(mesAtual: Date) {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const inicioMes = startOfMonth(mesAtual);
      const fimMes = endOfMonth(mesAtual);
      const mesNumero = mesAtual.getMonth() + 1;

      // Buscar eventos corporativos
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_corporativos')
        .select('*')
        .gte('data_inicio', format(inicioMes, 'yyyy-MM-dd'))
        .lte('data_inicio', format(fimMes, 'yyyy-MM-dd'))
        .eq('ativo', true)
        .order('data_inicio');

      if (eventosError) throw eventosError;

      // Buscar aniversariantes do mês
      const { data: aniversariantes, error: anivError } = await supabase
        .from('profiles')
        .select('id, nome, data_nascimento, avatar_url')
        .not('data_nascimento', 'is', null);

      if (anivError) throw anivError;

      // Buscar férias aprovadas do mês
      const { data: feriasData, error: feriasError } = await supabase
        .from('ferias')
        .select(`
          id, 
          data_inicio, 
          data_fim, 
          user_id,
          profiles!ferias_user_id_fkey(nome, avatar_url)
        `)
        .eq('status', 'aprovado')
        .or(`data_inicio.gte.${format(inicioMes, 'yyyy-MM-dd')},data_fim.gte.${format(inicioMes, 'yyyy-MM-dd')}`)
        .lte('data_inicio', format(fimMes, 'yyyy-MM-dd'));

      // Mapear eventos corporativos
      const eventosFormatados: EventoCalendario[] = (eventosData || []).map(e => ({
        id: e.id,
        titulo: e.titulo,
        descricao: e.descricao,
        data_inicio: e.data_inicio,
        data_fim: e.data_fim,
        hora_inicio: e.hora_inicio,
        hora_fim: e.hora_fim,
        tipo: e.tipo as EventoCalendario['tipo'],
        cor: e.cor || '#3b82f6',
        local: e.local,
        online: e.online,
        link_reuniao: e.link_reuniao,
      }));

      // Mapear aniversariantes
      const aniversariantesFormatados: EventoCalendario[] = (aniversariantes || [])
        .filter(a => {
          if (!a.data_nascimento) return false;
          const dataNasc = parseISO(a.data_nascimento);
          return dataNasc.getMonth() + 1 === mesNumero;
        })
        .map(a => {
          const dataNasc = parseISO(a.data_nascimento!);
          const dataEvento = new Date(mesAtual.getFullYear(), dataNasc.getMonth(), dataNasc.getDate());
          return {
            id: `aniv-${a.id}`,
            titulo: `🎂 Aniversário: ${a.nome?.split(' ')[0]}`,
            data_inicio: format(dataEvento, 'yyyy-MM-dd'),
            tipo: 'aniversario' as const,
            cor: '#ec4899',
            colaborador_nome: a.nome,
            colaborador_avatar: a.avatar_url,
          };
        });

      // Mapear férias
      const feriasFormatadas: EventoCalendario[] = (feriasData || []).map((f: any) => ({
        id: `ferias-${f.id}`,
        titulo: `🏖️ Férias: ${f.profiles?.nome?.split(' ')[0] || 'Colaborador'}`,
        data_inicio: f.data_inicio,
        data_fim: f.data_fim,
        tipo: 'ferias' as const,
        cor: '#14b8a6',
        colaborador_nome: f.profiles?.nome,
        colaborador_avatar: f.profiles?.avatar_url,
      }));

      setEventos([...eventosFormatados, ...aniversariantesFormatados, ...feriasFormatadas]);
    } catch (err) {
      console.error('Erro ao buscar calendário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar calendário');
    } finally {
      setIsLoading(false);
    }
  }, [mesAtual]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const getEventosDia = useCallback((data: Date): EventoCalendario[] => {
    return eventos.filter(e => {
      const dataInicio = parseISO(e.data_inicio);
      if (e.data_fim) {
        const dataFim = parseISO(e.data_fim);
        return isWithinInterval(data, { start: dataInicio, end: dataFim }) || isSameDay(data, dataInicio) || isSameDay(data, dataFim);
      }
      return isSameDay(data, dataInicio);
    });
  }, [eventos]);

  const eventosPorTipo = useMemo(() => {
    const grupos: Record<string, EventoCalendario[]> = {
      feriado: [],
      evento: [],
      aniversario: [],
      ferias: [],
      confraternizacao: [],
      treinamento: [],
    };
    eventos.forEach(e => {
      if (grupos[e.tipo]) {
        grupos[e.tipo].push(e);
      }
    });
    return grupos;
  }, [eventos]);

  return {
    eventos,
    isLoading,
    error,
    refetch: fetchEventos,
    getEventosDia,
    eventosPorTipo,
  };
}
