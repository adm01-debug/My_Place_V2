import { Award, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TrilhaProgress } from '@/components/portal/TrilhaProgress';
import type { BadgeUsuario, KudoPontos } from '@/hooks/useKudos';
import type { TrilhaComProgresso } from '@/hooks/useTrilhas';

interface PerfilConquistasProps {
  meusBadges: BadgeUsuario[] | undefined;
  meusPontos: KudoPontos | undefined;
  nivelAtual: string;
  trilhasEmAndamento: TrilhaComProgresso[] | undefined;
}

export function PerfilConquistas({ meusBadges, meusPontos, nivelAtual, trilhasEmAndamento }: PerfilConquistasProps) {
  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Minhas Conquistas
        </h3>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Nível Atual</span>
            <span className="font-bold text-lg">{nivelAtual}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pontos</span>
            <span className="font-medium">{meusPontos?.pontos_recebidos || 0}</span>
          </div>
        </div>
        {meusBadges && meusBadges.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {meusBadges.slice(0, 8).map(b => (
              <div key={b.badge_id} className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <span className="text-2xl">{b.badge?.icone || '🏅'}</span>
                <p className="text-xs mt-1 truncate">{b.badge?.nome}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma conquista ainda. Continue interagindo!
          </p>
        )}
      </Card>

      {trilhasEmAndamento && trilhasEmAndamento.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Trilhas em Andamento
          </h3>
          <div className="space-y-3">
            {trilhasEmAndamento.slice(0, 3).map(t => (
              <TrilhaProgress
                key={t.id}
                nome={t.nome}
                nivel={t.nivel}
                etapas={t.etapas || []}
                etapasConcluidas={t.progresso?.progresso_percentual ? Math.round((t.progresso.progresso_percentual / 100) * (t.etapas?.length || 1)) : 0}
                progressoPercentual={t.progresso?.progresso_percentual || 0}
                status={t.progresso?.status || 'nao_iniciada'}
                compact={true}
              />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
