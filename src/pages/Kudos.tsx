import React, { useState, useMemo } from 'react';
import { Heart, Trophy, Send, Sparkles, Medal, Award, TrendingUp } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useKudos } from '@/hooks/useKudos';
import { PageLayout, StatCard, EmptyState, SearchInput, Skeleton } from '@/components/portal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KudoFeedCard } from '@/components/kudos/KudoFeedCard';
import { KudoRankingItem } from '@/components/kudos/KudoRankingItem';
import { KudoBadgesGrid } from '@/components/kudos/KudoBadgesGrid';
import { EnviarKudoDialog } from '@/components/kudos/EnviarKudoDialog';

const Kudos: React.FC = () => {
  const { user } = useAuth();
  const {
    kudos, categorias, meusPontos, meusBadges, ranking,
    nivelAtual, progressoNivel, loading, enviarKudo, reagirKudo,
  } = useKudos();

  const [searchTerm, setSearchTerm] = useState('');

  const usuarios = useMemo(() => {
    const uniqueUsers = new Map();
    kudos.forEach(k => {
      if (k.de_usuario) uniqueUsers.set(k.de_usuario.id, k.de_usuario);
      if (k.para_usuario) uniqueUsers.set(k.para_usuario.id, k.para_usuario);
    });
    return Array.from(uniqueUsers.values()).filter(u => u.id !== user?.id);
  }, [kudos, user?.id]);

  const filteredKudos = useMemo(() => {
    if (!searchTerm) return kudos;
    const term = searchTerm.toLowerCase();
    return kudos.filter(k =>
      k.mensagem?.toLowerCase().includes(term) ||
      k.de_usuario?.nome?.toLowerCase().includes(term) ||
      k.para_usuario?.nome?.toLowerCase().includes(term)
    );
  }, [kudos, searchTerm]);

  if (loading) {
    return (
      <PageLayout title="Kudos">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Kudos" showBack>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Nível Atual" value={String(nivelAtual)} icon={Trophy} />
        <StatCard label="Kudos Recebidos" value={String(meusPontos?.total_kudos_recebidos || 0)} icon={Heart} />
        <StatCard label="Kudos Enviados" value={String(meusPontos?.total_kudos_enviados || 0)} icon={Send} />
        <StatCard label="Badges" value={String(meusBadges.length)} icon={Medal} />
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso para Nível {nivelAtual + 1}</span>
            <span className="text-sm text-muted-foreground">{progressoNivel}/100</span>
          </div>
          <Progress value={progressoNivel} className="h-2" />
        </CardContent>
      </Card>

      <Tabs defaultValue="feed" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="feed" className="gap-2"><Sparkles className="h-4 w-4" />Feed</TabsTrigger>
            <TabsTrigger value="ranking" className="gap-2"><TrendingUp className="h-4 w-4" />Ranking</TabsTrigger>
            <TabsTrigger value="badges" className="gap-2"><Award className="h-4 w-4" />Badges</TabsTrigger>
          </TabsList>
          <EnviarKudoDialog categorias={categorias} usuarios={usuarios} onEnviar={enviarKudo} />
        </div>

        <TabsContent value="feed" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar kudos..." />
            </div>
          </div>
          {filteredKudos.length === 0 ? (
            <EmptyState type="search" title="Nenhum kudo encontrado" description="Seja o primeiro a enviar um reconhecimento!" />
          ) : (
            <AnimatePresence>
              <div className="space-y-4">
                {filteredKudos.map(kudo => (
                  <KudoFeedCard key={kudo.id} kudo={kudo} onReact={reagirKudo} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />Top 10 Colaboradores</CardTitle>
              <CardDescription>Ranking baseado em kudos recebidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {ranking.map(item => (
                    <KudoRankingItem
                      key={item.usuario_id}
                      posicao={item.posicao}
                      nome={item.nome}
                      avatar={item.avatar_url}
                      cargo={item.cargo}
                      pontos={item.pontos_recebidos}
                      nivel={item.nivel}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" />Minhas Conquistas</CardTitle>
              <CardDescription>{meusBadges.length} de 8 badges conquistados</CardDescription>
            </CardHeader>
            <CardContent>
              <KudoBadgesGrid meusBadges={meusBadges} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Kudos;
