import { useState } from 'react';
import { Cake, PartyPopper, Send, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAniversariantes, Aniversariante } from '@/hooks/useAniversariantes';
import { Skeleton } from '@/components/ui/skeleton';

const mensagensPredefinidas = [
  'Feliz aniversário! Que esse dia seja repleto de alegrias! 🎉',
  'Parabéns pelo seu dia! Desejo muito sucesso e felicidade! 🎂',
  'Muitas felicidades! Que todos os seus sonhos se realizem! 🌟',
  'Feliz aniversário! Muita saúde e prosperidade! 🎈',
];

export function AniversariantesCard() {
  const { aniversariantes, isLoading, enviarParabens } = useAniversariantes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Aniversariante | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const hoje = new Date().getDate();

  const handleEnviarParabens = async () => {
    if (!selectedPerson) return;
    
    setEnviando(true);
    const success = await enviarParabens(selectedPerson.id, mensagem || mensagensPredefinidas[0]);
    setEnviando(false);
    
    if (success) {
      setDialogOpen(false);
      setMensagem('');
      setSelectedPerson(null);
    }
  };

  const openDialog = (pessoa: Aniversariante) => {
    setSelectedPerson(pessoa);
    setMensagem('');
    setDialogOpen(true);
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  if (aniversariantes.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center">
              <Cake className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Aniversariantes</h3>
              <p className="text-xs text-muted-foreground capitalize">{mesAtual}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {aniversariantes.length} {aniversariantes.length === 1 ? 'pessoa' : 'pessoas'}
          </Badge>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {aniversariantes.map((pessoa) => {
            const isHoje = pessoa.dia === hoje;
            
            return (
              <div 
                key={pessoa.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isHoje ? 'bg-gradient-to-r from-primary/10 to-pink-500/10 border border-primary/20' : 'hover:bg-muted/50'
                }`}
              >
                <Avatar className="w-10 h-10 border-2 border-background shadow">
                  <AvatarImage src={pessoa.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(pessoa.nome)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{pessoa.nome}</p>
                    {isHoje && (
                      <Badge className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xs shrink-0">
                        <PartyPopper className="w-3 h-3 mr-1" />
                        Hoje!
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {pessoa.cargo || 'Colaborador'} • Dia {pessoa.dia}
                  </p>
                </div>

                {pessoa.parabenizado ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled
                    className="shrink-0 text-finance"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <span className="text-xs">Enviado</span>
                  </Button>
                ) : (
                  <Button 
                    variant={isHoje ? 'default' : 'outline'}
                    size="sm"
                    className="shrink-0"
                    onClick={() => openDialog(pessoa)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    <span className="text-xs">Parabéns</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-primary" />
              Enviar Parabéns
            </DialogTitle>
            <DialogDescription>
              Envie uma mensagem de felicitação para {selectedPerson?.nome.split(' ')[0]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="w-12 h-12">
                <AvatarImage src={selectedPerson?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedPerson ? getInitials(selectedPerson.nome) : '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedPerson?.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPerson?.cargo} • Dia {selectedPerson?.dia}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Mensagens rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {mensagensPredefinidas.map((msg, i) => (
                  <Button
                    key={i}
                    variant={mensagem === msg ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-auto py-2 px-3"
                    onClick={() => setMensagem(msg)}
                  >
                    {msg.slice(0, 30)}...
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Ou escreva sua mensagem:</p>
              <Textarea
                placeholder="Digite sua mensagem de felicitação..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEnviarParabens}
              disabled={enviando}
              className="bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500"
            >
              {enviando ? 'Enviando...' : 'Enviar Parabéns'}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
