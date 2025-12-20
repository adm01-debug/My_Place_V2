import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';

type TipoRegistro = 'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim';
type StatusRegistro = 'aprovado' | 'pendente' | 'rejeitado' | 'fora_area';

interface RegistroPonto {
  id: string;
  tipo: TipoRegistro;
  data_hora: string;
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
  status: StatusRegistro;
  observacao: string | null;
  created_at: string;
}

interface EspelhoPonto {
  data: string;
  registros: RegistroPonto[];
  horasTrabalhadas: number; // em minutos
  status: 'ok' | 'incompleto' | 'falta' | 'feriado' | 'dsr';
}

interface ResumoMensal {
  horasNormais: number;
  horasExtras: number;
  bancoHoras: number;
  faltas: number;
  atrasos: number;
}

export function useRegistrosPonto() {
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [espelhoMes, setEspelhoMes] = useState<EspelhoPonto[]>([]);
  const [resumoMensal, setResumoMensal] = useState<ResumoMensal>({
    horasNormais: 0,
    horasExtras: 0,
    bancoHoras: 0,
    faltas: 0,
    atrasos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRegistros = async (mes?: Date) => {
    if (!user) return;

    setIsLoading(true);
    
    const mesRef = mes || new Date();
    const inicio = startOfMonth(mesRef);
    const fim = endOfMonth(mesRef);

    const { data, error } = await supabase
      .from('registros_ponto')
      .select('*')
      .eq('user_id', user.id)
      .gte('data_hora', inicio.toISOString())
      .lte('data_hora', fim.toISOString())
      .order('data_hora', { ascending: true });

    if (error) {
      console.error('Error fetching registros:', error);
      toast({
        title: 'Erro ao carregar registros',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const registrosData = (data || []) as RegistroPonto[];
    setRegistros(registrosData);

    // Gerar espelho do mês
    const espelho = gerarEspelhoMes(registrosData, mesRef);
    setEspelhoMes(espelho);

    // Calcular resumo
    const resumo = calcularResumoMensal(espelho);
    setResumoMensal(resumo);

    setIsLoading(false);
  };

  const gerarEspelhoMes = (registros: RegistroPonto[], mesRef: Date): EspelhoPonto[] => {
    const espelho: EspelhoPonto[] = [];
    const inicio = startOfMonth(mesRef);
    const fim = endOfMonth(mesRef);
    const hoje = new Date();

    let dataAtual = new Date(inicio);
    while (dataAtual <= fim && dataAtual <= hoje) {
      const dataStr = format(dataAtual, 'yyyy-MM-dd');
      const diaSemana = dataAtual.getDay();
      
      // Filtrar registros do dia
      const registrosDia = registros.filter(r => 
        format(new Date(r.data_hora), 'yyyy-MM-dd') === dataStr
      );

      // Calcular horas trabalhadas
      const horas = calcularHorasDia(registrosDia);

      // Determinar status
      let status: EspelhoPonto['status'] = 'ok';
      if (diaSemana === 0) {
        status = 'dsr'; // Domingo
      } else if (registrosDia.length === 0) {
        status = 'falta';
      } else if (registrosDia.length % 2 !== 0) {
        status = 'incompleto'; // Número ímpar de batidas
      } else if (horas < 480 && diaSemana !== 6) { // 8h = 480min
        status = 'ok'; // Pode ter saído mais cedo
      }

      espelho.push({
        data: dataStr,
        registros: registrosDia,
        horasTrabalhadas: horas,
        status,
      });

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return espelho.reverse(); // Mais recente primeiro
  };

  const calcularHorasDia = (registros: RegistroPonto[]): number => {
    if (registros.length < 2) return 0;

    let totalMinutos = 0;
    const entradas = registros.filter(r => r.tipo === 'entrada' || r.tipo === 'intervalo_fim');
    const saidas = registros.filter(r => r.tipo === 'saida' || r.tipo === 'intervalo_inicio');

    for (let i = 0; i < Math.min(entradas.length, saidas.length); i++) {
      const entrada = new Date(entradas[i].data_hora);
      const saida = new Date(saidas[i].data_hora);
      totalMinutos += differenceInMinutes(saida, entrada);
    }

    return Math.max(0, totalMinutos);
  };

  const calcularResumoMensal = (espelho: EspelhoPonto[]): ResumoMensal => {
    const diasUteis = espelho.filter(e => e.status !== 'dsr' && e.status !== 'feriado');
    
    const totalMinutos = diasUteis.reduce((acc, e) => acc + e.horasTrabalhadas, 0);
    const jornadaDiaria = 480; // 8 horas em minutos
    const horasEsperadas = diasUteis.length * jornadaDiaria;
    
    const horasNormais = Math.min(totalMinutos, horasEsperadas);
    const horasExtras = Math.max(0, totalMinutos - horasEsperadas);
    const bancoHoras = totalMinutos - horasEsperadas;
    
    const faltas = diasUteis.filter(e => e.status === 'falta').length;
    const atrasos = diasUteis.filter(e => 
      e.registros.length > 0 && 
      e.horasTrabalhadas < jornadaDiaria - 15 // tolerância de 15min
    ).length;

    return {
      horasNormais,
      horasExtras,
      bancoHoras,
      faltas,
      atrasos,
    };
  };

  const registrarPonto = async (
    tipo: TipoRegistro,
    latitude?: number,
    longitude?: number,
    endereco?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    // Determinar status baseado na localização
    let status: StatusRegistro = 'aprovado';
    
    if (latitude && longitude) {
      // Validar localização remotamente
      const { data: validacao } = await (supabase as any)
        .rpc('fn_esta_em_local_permitido', {
          p_latitude: latitude,
          p_longitude: longitude,
        });

      if (validacao === false) {
        status = 'fora_area';
      }
    }

    const { data, error } = await supabase
      .from('registros_ponto')
      .insert({
        user_id: user.id,
        tipo,
        latitude,
        longitude,
        endereco,
        status,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Atualizar lista local
    setRegistros(prev => [data as RegistroPonto, ...prev]);
    
    return { success: true, data, status };
  };

  const getRegistrosHoje = (): RegistroPonto[] => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    return registros.filter(r => 
      format(new Date(r.data_hora), 'yyyy-MM-dd') === hoje
    );
  };

  const getProximoTipo = (): TipoRegistro => {
    const hoje = getRegistrosHoje();
    const entradas = hoje.filter(r => r.tipo === 'entrada').length;
    const saidas = hoje.filter(r => r.tipo === 'saida').length;
    
    return entradas > saidas ? 'saida' : 'entrada';
  };

  const formatarHoras = (minutos: number): string => {
    const horas = Math.floor(Math.abs(minutos) / 60);
    const mins = Math.abs(minutos) % 60;
    const sinal = minutos < 0 ? '-' : minutos > 0 ? '+' : '';
    return `${sinal}${horas}:${String(mins).padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchRegistros();
  }, [user]);

  return {
    registros,
    espelhoMes,
    resumoMensal,
    isLoading,
    registrarPonto,
    getRegistrosHoje,
    getProximoTipo,
    formatarHoras,
    refetch: fetchRegistros,
  };
}
