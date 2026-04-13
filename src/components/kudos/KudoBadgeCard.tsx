import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KudoBadgeCardProps {
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  conquistado?: boolean;
  data?: string;
}

export const KudoBadgeCard: React.FC<KudoBadgeCardProps> = ({ nome, descricao, icone, cor, conquistado, data }) => (
  <div className={`p-4 rounded-lg border text-center transition-all ${
    conquistado
      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20'
      : 'bg-muted/50 opacity-60'
  }`}>
    <div className="text-4xl mb-2" style={{ filter: conquistado ? 'none' : 'grayscale(1)' }}>
      {icone}
    </div>
    <h4 className="font-semibold text-sm">{nome}</h4>
    <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
    {conquistado && data && (
      <p className="text-xs text-primary mt-2">
        ✓ {format(new Date(data), "dd/MM/yyyy", { locale: ptBR })}
      </p>
    )}
  </div>
);
