import { useState, useCallback } from 'react';
import { useDashboard } from '@/hooks/useDashboard';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistente-rh`;

export function useAssistenteRH() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    colaborador,
    saldoFerias,
    bancoHoras,
    horasTrabalhadas,
    salarioEstimado,
    treinamentosPendentes,
    solicitacoesPendentes,
    emprestimoAtivo,
  } = useDashboard();

  const buildContexto = useCallback(() => ({
    nome: colaborador?.nome,
    cargo: colaborador?.cargo,
    departamento: colaborador?.departamento,
    saldoFerias,
    bancoHoras,
    horasTrabalhadas,
    salarioEstimado,
    treinamentosPendentes,
    solicitacoesPendentes,
    emprestimoAtivo: emprestimoAtivo ? {
      saldo_devedor: emprestimoAtivo.saldo_devedor,
      parcelas_restantes: emprestimoAtivo.parcelas_restantes,
    } : null,
  }), [colaborador, saldoFerias, bancoHoras, horasTrabalhadas, salarioEstimado, treinamentosPendentes, solicitacoesPendentes, emprestimoAtivo]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        }];
      });
    };

    try {
      const messagesToSend = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: messagesToSend,
          contexto: buildContexto(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao conectar com o assistente');
      }

      if (!response.body) {
        throw new Error('Resposta vazia do servidor');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('Assistente RH error:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, buildContexto]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}