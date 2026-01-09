import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Star, Trophy, Users, Send, Sparkles, 
  Medal, Award, TrendingUp, Filter, Search,
  ThumbsUp, MessageCircle, Share2, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useKudos, Kudo, KudoCategoria } from '@/hooks/useKudos';
import { PageLayout, StatCard, EmptyState, SearchInput, Skeleton } from '@/components/portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

interface KudoCardProps {
  kudo: Kudo;
  onReact: (kudoId: string, emoji: string) => void;
}

const KudoCard: React.FC<KudoCardProps> = ({ kudo, onReact }) => {
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={kudo.de_usuario?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(kudo.de_usuario?.nome || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {kudo.de_usuario?.nome}
                  <span className="text-muted-foreground font-normal"> reconheceu </span>
                  {kudo.para_usuario?.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(kudo.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ 
                backgroundColor: `${kudo.categoria?.cor}20`, 
                color: kudo.categoria?.cor,
                borderColor: kudo.categoria?.cor 
              }}
            >
              {kudo.categoria?.icone} {kudo.categoria?.nome}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm">{kudo.mensagem}</p>
        </CardContent>
        <CardFooter className="pt-0 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2"
            onClick={() => onReact(kudo.id, '👏')}
          >
            👏 <span className="ml-1 text-xs">{kudo.reacoes_count || 0}</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Share2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

interface BadgeCardProps {
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  conquistado?: boolean;
  data?: string;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ nome, descricao, icone, cor, conquistado, data }) => {
  return (
    <div className={`p-4 rounded-lg border text-center transition-all ${
      conquistado 
        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20' 
        : 'bg-muted/50 opacity-60'
    }`}>
      <div 
        className="text-4xl mb-2"
        style={{ filter: conquistado ? 'none' : 'grayscale(1)' }}
      >
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
};

interface RankingItemProps {
  posicao: number;
  nome: string;
  avatar?: string | null;
  cargo?: string | null;
  pontos: number;
  nivel: number;
}

const RankingItem: React.FC<RankingItemProps> = ({ posicao, nome, avatar, cargo, pontos, nivel }) => {
  const getMedalha = (pos: number) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `${pos}º`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="text-xl font-bold w-8 text-center">
        {getMedalha(posicao)}
      </div>
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

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const Kudos: React.FC = () => {
  const { user, profile } = useAuth();
  const {
    kudos,
    categorias,
    meusPontos,
    meusBadges,
    ranking,
    kudosRecebidos,
    kudosEnviados,
    nivelAtual,
    progressoNivel,
    loading,
    enviarKudo,
    reagirKudo,
    refresh,
  } = useKudos();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedUsuario, setSelectedUsuario] = useState<string>('');
  const [mensagem, setMensagem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Mock de usuários para seleção (em produção, buscar do banco)
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

  const handleEnviarKudo = async () => {
    if (!selectedCategoria || !selectedUsuario || !mensagem.trim()) return;

    setEnviando(true);
    await enviarKudo({
      para_usuario_id: selectedUsuario,
      categoria_id: selectedCategoria,
      mensagem: mensagem.trim(),
      publico: true,
    });
    setEnviando(false);
    setIsDialogOpen(false);
    setSelectedCategoria('');
    setSelectedUsuario('');
    setMensagem('');
  };

  if (loading) {
    return (
      <PageLayout title="Kudos">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Kudos"
      showBack
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Nível Atual"
          value={String(nivelAtual)}
          icon={Trophy}
        />
        <StatCard
          label="Kudos Recebidos"
          value={String(meusPontos?.total_kudos_recebidos || 0)}
          icon={Heart}
        />
        <StatCard
          label="Kudos Enviados"
          value={String(meusPontos?.total_kudos_enviados || 0)}
          icon={Send}
        />
        <StatCard
          label="Badges"
          value={String(meusBadges.length)}
          icon={Medal}
        />
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso para Nível {nivelAtual + 1}</span>
            <span className="text-sm text-muted-foreground">{progressoNivel}/100</span>
          </div>
          <Progress value={progressoNivel} className="h-2" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="feed" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="feed" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="ranking" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="h-4 w-4" />
              Badges
            </TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Enviar Kudo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Enviar Reconhecimento</DialogTitle>
                <DialogDescription>
                  Reconheça um colega pelo ótimo trabalho!
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Para quem?</Label>
                  <Select value={selectedUsuario} onValueChange={setSelectedUsuario}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colega" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icone} {c.nome} (+{c.pontos} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    placeholder="Escreva uma mensagem de reconhecimento..."
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleEnviarKudo} 
                  disabled={!selectedCategoria || !selectedUsuario || !mensagem.trim() || enviando}
                >
                  {enviando ? 'Enviando...' : 'Enviar Kudo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Feed Tab */}
        <TabsContent value="feed" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar kudos..."
              />
            </div>
          </div>

          {filteredKudos.length === 0 ? (
            <EmptyState
              type="search"
              title="Nenhum kudo encontrado"
              description="Seja o primeiro a enviar um reconhecimento!"
              action={{
                label: 'Enviar Kudo',
                onClick: () => setIsDialogOpen(true),
              }}
            />
          ) : (
            <AnimatePresence>
              <div className="space-y-4">
                {filteredKudos.map(kudo => (
                  <KudoCard 
                    key={kudo.id} 
                    kudo={kudo} 
                    onReact={reagirKudo}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top 10 Colaboradores
              </CardTitle>
              <CardDescription>
                Ranking baseado em kudos recebidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {ranking.map(item => (
                    <RankingItem
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

        {/* Badges Tab */}
        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Minhas Conquistas
              </CardTitle>
              <CardDescription>
                {meusBadges.length} de 8 badges conquistados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <BadgeCard
                  nome="Primeiros Passos"
                  descricao="Enviou seu primeiro kudo"
                  icone="🌟"
                  cor="#FFD700"
                  conquistado={meusBadges.some(b => b.badge?.nome === 'Primeiros Passos')}
                  data={meusBadges.find(b => b.badge?.nome === 'Primeiros Passos')?.conquistado_em}
                />
                <BadgeCard
                  nome="Popular"
                  descricao="Recebeu 10 kudos"
                  icone="❤️"
                  cor="#FF6B6B"
                  conquistado={meusBadges.some(b => b.badge?.nome === 'Popular')}
                  data={meusBadges.find(b => b.badge?.nome === 'Popular')?.conquistado_em}
                />
                <BadgeCard
                  nome="Generoso"
                  descricao="Enviou 25 kudos"
                  icone="🎁"
                  cor="#4ECDC4"
                  conquistado={meusBadges.some(b => b.badge?.nome === 'Generoso')}
                  data={meusBadges.find(b => b.badge?.nome === 'Generoso')?.conquistado_em}
                />
                <BadgeCard
                  nome="Estrela"
                  descricao="Recebeu 50 kudos"
                  icone="⭐"
                  cor="#FFE66D"
                  conquistado={meusBadges.some(b => b.badge?.nome === 'Estrela')}
                  data={meusBadges.find(b => b.badge?.nome === 'Estrela')?.conquistado_em}
                />
                <BadgeCard
                  nome="Inspirador"
                  descricao="100 pontos recebidos"
                  icone="💡"
                  cor="#A8E6CF"
                  conquistado={meusBadges.some(b => b.badge?.nome === 'Inspirador')}
                  data={meusBadges.find(b => b.badge?.nome === 'Inspirador')?.conquistado_em}
                />
                <BadgeCard
                  nome="Embaixador"
                  descricao="Enviou 100 kudos"
                  icone="🏅"
                  cor="#DDA0DD"
                  conquistado={meusBadges.some(b => b.badge?.nome === 'Embaixador')}
                  data={meusBadges.find(b => b.badge?.nome === 'Embaixador')?.conquistado_em}
                />
                <BadgeCard
                  nome="Lenda"
                  descricao="Recebeu 200 kudos"
                  icone="🏆"
                  cor="#FFD700"
                  conquistado={meusBadges.some(b => b.badge?.nome === 'Lenda')}
                  data={meusBadges.find(b => b.badge?.nome === 'Lenda')?.conquistado_em}
                />
                <BadgeCard
                  nome="Diversidade"
                  descricao="Kudos em todas categorias"
                  icone="🌈"
                  cor="#FF69B4"
                  conquistado={meusBadges.some(b => b.badge?.nome === 'Diversidade')}
                  data={meusBadges.find(b => b.badge?.nome === 'Diversidade')?.conquistado_em}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Kudos;
