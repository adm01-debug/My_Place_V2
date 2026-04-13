import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface KudoRankingItemProps {
  posicao: number;
  nome: string;
  avatar?: string | null;
  cargo?: string | null;
  pontos: number;
  nivel: number;
}

export const KudoRankingItem: React.FC<KudoRankingItemProps> = ({ posicao, nome, avatar, cargo, pontos, nivel }) => {
  const getMedalha = (pos: number) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `${pos}º`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="text-xl font-bold w-8 text-center">{getMedalha(posicao)}</div>
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {nome?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{nome}</p>
        <p className="text-xs text-muted-foreground truncate">{cargo}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-sm">{pontos} pts</p>
        <p className="text-xs text-muted-foreground">Nível {nivel}</p>
      </div>
    </div>
  );
};
