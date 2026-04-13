import { Calendar as CalendarIcon, Clock, MapPin, Video, ExternalLink, Gift, Umbrella, PartyPopper, Flag, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import type { EventoCalendario } from '@/hooks/useCalendarioCorporativo';

const tipoIcons: Record<string, any> = {
  feriado: Flag,
  evento: CalendarIcon,
  aniversario: Gift,
  ferias: Umbrella,
  confraternizacao: PartyPopper,
  treinamento: Users,
};

const tipoLabels: Record<string, string> = {
  feriado: 'Feriado',
  evento: 'Evento',
  aniversario: 'Aniversário',
  ferias: 'Férias',
  confraternizacao: 'Confraternização',
  treinamento: 'Treinamento',
};

export function EventoCard({ evento }: { evento: EventoCalendario }) {
  const Icon = tipoIcons[evento.tipo] || CalendarIcon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-3 border-l-4" style={{ borderLeftColor: evento.cor }}>
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${evento.cor}20` }}
          >
            {evento.colaborador_avatar ? (
              <Avatar className="w-8 h-8">
                <AvatarImage src={evento.colaborador_avatar} />
                <AvatarFallback style={{ backgroundColor: evento.cor }} className="text-white text-xs">
                  {evento.colaborador_nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Icon className="w-5 h-5" style={{ color: evento.cor }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{evento.titulo}</p>
                {evento.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{evento.descricao}</p>
                )}
              </div>
              <Badge variant="secondary" className="text-xs shrink-0" style={{ backgroundColor: `${evento.cor}15`, color: evento.cor }}>
                {tipoLabels[evento.tipo]}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {evento.hora_inicio && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />{evento.hora_inicio.slice(0, 5)}{evento.hora_fim && ` - ${evento.hora_fim.slice(0, 5)}`}
                </span>
              )}
              {evento.local && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{evento.local}</span>
              )}
              {evento.online && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Video className="w-3 h-3" />Online</span>
              )}
              {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="w-3 h-3" />até {format(parseISO(evento.data_fim), 'dd/MM')}
                </span>
              )}
            </div>

            {evento.link_reuniao && (
              <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-xs" asChild>
                <a href={evento.link_reuniao} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" />Acessar reunião
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
