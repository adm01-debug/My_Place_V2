import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTrilhas } from '@/hooks/useTrilhas';

export const TrilhasWidget: React.FC = () => {
  const { trilhasEmAndamento, trilhasConcluidas, totalHorasConcluidas, loading } = useTrilhas();
  const trilhaAtiva = trilhasEmAndamento[0];

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-500" />
          Trilhas de Desenvolvimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold">{trilhasConcluidas.length}</p>
            <p className="text-xs text-muted-foreground">{totalHorasConcluidas}h completadas</p>
          </div>
          <Zap className="h-8 w-8 text-yellow-500" />
        </div>
        {trilhaAtiva && (
          <div className="mb-3 p-2 bg-muted rounded-lg">
            <p className="text-xs font-medium truncate">{trilhaAtiva.nome}</p>
            <Progress value={trilhaAtiva.progresso?.progresso_percentual || 0} className="h-1 mt-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(trilhaAtiva.progresso?.progresso_percentual || 0)}% concluído
            </p>
          </div>
        )}
        <Link to="/trilhas">
          <Button variant="outline" size="sm" className="w-full">
            Ver trilhas <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default TrilhasWidget;
