import React from 'react';
import { KudoBadgeCard } from './KudoBadgeCard';

interface BadgeInfo {
  badge_id: string;
  conquistado_em?: string;
  badge?: { nome?: string; icone?: string };
}

const BADGES_CONFIG = [
  { nome: 'Primeiros Passos', descricao: 'Enviou seu primeiro kudo', icone: '🌟', cor: '#FFD700' },
  { nome: 'Popular', descricao: 'Recebeu 10 kudos', icone: '❤️', cor: '#FF6B6B' },
  { nome: 'Generoso', descricao: 'Enviou 25 kudos', icone: '🎁', cor: '#4ECDC4' },
  { nome: 'Estrela', descricao: 'Recebeu 50 kudos', icone: '⭐', cor: '#FFE66D' },
  { nome: 'Inspirador', descricao: '100 pontos recebidos', icone: '💡', cor: '#A8E6CF' },
  { nome: 'Embaixador', descricao: 'Enviou 100 kudos', icone: '🏅', cor: '#DDA0DD' },
  { nome: 'Lenda', descricao: 'Recebeu 200 kudos', icone: '🏆', cor: '#FFD700' },
  { nome: 'Diversidade', descricao: 'Kudos em todas categorias', icone: '🌈', cor: '#FF69B4' },
];

interface KudoBadgesGridProps {
  meusBadges: BadgeInfo[];
}

export const KudoBadgesGrid: React.FC<KudoBadgesGridProps> = ({ meusBadges }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {BADGES_CONFIG.map(badge => (
      <KudoBadgeCard
        key={badge.nome}
        {...badge}
        conquistado={meusBadges.some(b => b.badge?.nome === badge.nome)}
        data={meusBadges.find(b => b.badge?.nome === badge.nome)?.conquistado_em}
      />
    ))}
  </div>
);
