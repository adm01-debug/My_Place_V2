import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Kudo } from '@/hooks/useKudos';

interface KudoFeedCardProps {
  kudo: Kudo;
  onReact: (kudoId: string, emoji: string) => void;
}

export const KudoFeedCard: React.FC<KudoFeedCardProps> = ({ kudo, onReact }) => {
  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

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
                borderColor: kudo.categoria?.cor,
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
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onReact(kudo.id, '👏')}>
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
