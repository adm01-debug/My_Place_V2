import { ChevronRight, Users, User, Building2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import type { ColaboradorOrganograma } from '@/hooks/useOrganograma';

interface ColaboradorDetailProps {
  colaborador: ColaboradorOrganograma;
  gestor?: ColaboradorOrganograma;
  subordinados: ColaboradorOrganograma[];
  onNavigate: (c: ColaboradorOrganograma) => void;
  onClose: () => void;
}

function getInitials(nome: string) {
  return nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export function ColaboradorDetail({ colaborador, gestor, subordinados, onNavigate, onClose }: ColaboradorDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary shadow-lg">
              <AvatarImage src={colaborador.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {getInitials(colaborador.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{colaborador.nome}</h3>
              <p className="text-muted-foreground">{colaborador.cargo || 'Cargo não definido'}</p>
              {colaborador.departamento && (
                <Badge variant="outline" className="mt-1"><Building2 className="h-3 w-3 mr-1" />{colaborador.departamento}</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {gestor && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />Reporta a
            </h4>
            <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onNavigate(gestor)}>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={gestor.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(gestor.nome)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{gestor.nome}</p>
                  <p className="text-xs text-muted-foreground">{gestor.cargo}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {subordinados.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />Equipe ({subordinados.length})
            </h4>
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {subordinados.map((sub) => (
                  <Card key={sub.id} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onNavigate(sub)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sub.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(sub.nome)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sub.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{sub.cargo}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
