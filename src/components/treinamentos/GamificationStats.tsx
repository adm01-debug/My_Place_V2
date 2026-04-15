import { Trophy, Flame, Star, Award, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GamificationStatsProps {
  totalRealizados: number;
  horasTotal: number;
  totalPendentes: number;
}

// Badge tiers based on completed trainings
const BADGES = [
  { threshold: 1, icon: Star, label: 'Iniciante', color: 'text-muted-foreground', bg: 'bg-muted' },
  { threshold: 3, icon: Zap, label: 'Dedicado', color: 'text-primary', bg: 'bg-primary/10' },
  { threshold: 5, icon: Award, label: 'Expert', color: 'text-projects', bg: 'bg-projects/10' },
  { threshold: 10, icon: Trophy, label: 'Master', color: 'text-finance', bg: 'bg-finance/10' },
  { threshold: 20, icon: Flame, label: 'Lenda', color: 'text-destructive', bg: 'bg-destructive/10' },
];

function getCurrentBadge(completed: number) {
  let current = BADGES[0];
  for (const badge of BADGES) {
    if (completed >= badge.threshold) current = badge;
  }
  return current;
}

function getNextBadge(completed: number) {
  for (const badge of BADGES) {
    if (completed < badge.threshold) return badge;
  }
  return null;
}

export function GamificationStats({ totalRealizados, horasTotal, totalPendentes }: GamificationStatsProps) {
  const currentBadge = getCurrentBadge(totalRealizados);
  const nextBadge = getNextBadge(totalRealizados);
  const CurrentIcon = currentBadge.icon;

  // Progress to next badge
  const prevThreshold = currentBadge.threshold;
  const nextThreshold = nextBadge?.threshold || currentBadge.threshold;
  const progressToNext = nextBadge 
    ? Math.min(100, ((totalRealizados - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
    : 100;

  // XP calculation (each training = 100 XP, each hour = 10 XP)
  const xp = totalRealizados * 100 + horasTotal * 10;

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 via-card to-finance/5 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-finance/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        {/* Header with badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentBadge.bg} ring-2 ring-offset-2 ring-offset-card ring-primary/20`}>
              <CurrentIcon className={`w-6 h-6 ${currentBadge.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground">{currentBadge.label}</p>
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {xp} XP
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {totalRealizados} treinamento{totalRealizados !== 1 ? 's' : ''} • {horasTotal}h de estudo
              </p>
            </div>
          </div>
        </div>

        {/* Progress to next badge */}
        {nextBadge && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Próximo nível: {nextBadge.label}</span>
              <span className="font-medium text-foreground">
                {totalRealizados}/{nextBadge.threshold}
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}

        {/* Badges earned row */}
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground mr-1">Conquistas:</p>
          {BADGES.map((badge) => {
            const BadgeIcon = badge.icon;
            const earned = totalRealizados >= badge.threshold;
            return (
              <div
                key={badge.label}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  earned 
                    ? `${badge.bg} ${badge.color} scale-100` 
                    : 'bg-muted/50 text-muted-foreground/30 scale-90'
                }`}
                title={earned ? `${badge.label} — Desbloqueado!` : `${badge.label} — ${badge.threshold} treinamentos`}
              >
                <BadgeIcon className="w-4 h-4" />
              </div>
            );
          })}
        </div>

        {/* Motivational message */}
        {totalPendentes > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-projects/5 border border-projects/10">
            <p className="text-xs text-projects flex items-center gap-1">
              <Target className="w-3 h-3" />
              {nextBadge 
                ? `Complete mais ${nextBadge.threshold - totalRealizados} treinamento${nextBadge.threshold - totalRealizados > 1 ? 's' : ''} para alcançar ${nextBadge.label}!`
                : 'Parabéns! Você é uma lenda! 🔥'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}