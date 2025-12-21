import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronRight, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useKudos } from '@/hooks/useKudos';

export const KudosWidget: React.FC = () => {
  const { kudosRecebidos, meusPontos, nivelAtual, loading } = useKudos();
  const recentKudos = kudosRecebidos.slice(0, 3);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500" />
          Kudos Recebidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold">{meusPontos?.total_kudos_recebidos || 0}</p>
            <p className="text-xs text-muted-foreground">Nível {nivelAtual}</p>
          </div>
          <Star className="h-8 w-8 text-yellow-500" />
        </div>
        {recentKudos.length > 0 && (
          <div className="space-y-2 mb-3">
            {recentKudos.map(k => (
              <div key={k.id} className="flex items-center gap-2 text-xs">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={k.de_usuario?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {k.de_usuario?.nome?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate flex-1">{k.de_usuario?.nome}</span>
                <span>{k.categoria?.icone}</span>
              </div>
            ))}
          </div>
        )}
        <Link to="/kudos">
          <Button variant="outline" size="sm" className="w-full">
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default KudosWidget;
