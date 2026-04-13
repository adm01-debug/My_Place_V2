import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { KudoCategoria } from '@/hooks/useKudos';

interface EnviarKudoDialogProps {
  categorias: KudoCategoria[];
  usuarios: { id: string; nome: string }[];
  onEnviar: (data: { para_usuario_id: string; categoria_id: string; mensagem: string; publico: boolean }) => Promise<any>;
}

export const EnviarKudoDialog: React.FC<EnviarKudoDialogProps> = ({ categorias, usuarios, onEnviar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async () => {
    if (!selectedCategoria || !selectedUsuario || !mensagem.trim()) return;
    setEnviando(true);
    await onEnviar({
      para_usuario_id: selectedUsuario,
      categoria_id: selectedCategoria,
      mensagem: mensagem.trim(),
      publico: true,
    });
    setEnviando(false);
    setIsOpen(false);
    setSelectedCategoria('');
    setSelectedUsuario('');
    setMensagem('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Send className="h-4 w-4" />
          Enviar Kudo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Reconhecimento</DialogTitle>
          <DialogDescription>Reconheça um colega pelo ótimo trabalho!</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Para quem?</Label>
            <Select value={selectedUsuario} onValueChange={setSelectedUsuario}>
              <SelectTrigger><SelectValue placeholder="Selecione um colega" /></SelectTrigger>
              <SelectContent>
                {usuarios.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
              <SelectContent>
                {categorias.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.icone} {c.nome} (+{c.pontos} pts)</SelectItem>
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
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleEnviar} disabled={!selectedCategoria || !selectedUsuario || !mensagem.trim() || enviando}>
            {enviando ? 'Enviando...' : 'Enviar Kudo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
