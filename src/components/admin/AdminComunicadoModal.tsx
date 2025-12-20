import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categorias = ['RH', 'Financeiro', 'Institucional', 'Saúde', 'TI', 'Eventos', 'Benefícios', 'Treinamentos', 'Outros'];

interface AdminComunicadoModalProps {
  open: boolean;
  onClose: () => void;
  data?: any;
  onSave: (data: any) => Promise<void>;
}

export function AdminComunicadoModal({ open, onClose, data, onSave }: AdminComunicadoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    conteudo: '',
    resumo: '',
    categoria: 'Outros',
    importante: false,
    fixado: false,
    ativo: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        titulo: data.titulo || '',
        conteudo: data.conteudo || '',
        resumo: data.resumo || '',
        categoria: data.categoria || 'Outros',
        importante: data.importante || false,
        fixado: data.fixado || false,
        ativo: data.ativo !== false,
      });
    } else {
      setForm({
        titulo: '',
        conteudo: '',
        resumo: '',
        categoria: 'Outros',
        importante: false,
        fixado: false,
        ativo: true,
      });
    }
  }, [data, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.conteudo.trim()) return;

    setIsSubmitting(true);
    await onSave(form);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Comunicado' : 'Novo Comunicado'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título do comunicado"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resumo">Resumo</Label>
            <Textarea
              id="resumo"
              value={form.resumo}
              onChange={(e) => setForm({ ...form, resumo: e.target.value })}
              placeholder="Resumo breve (opcional)"
              rows={2}
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <Textarea
              id="conteudo"
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              placeholder="Conteúdo do comunicado"
              rows={6}
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="importante">Marcar como Importante</Label>
              <Switch
                id="importante"
                checked={form.importante}
                onCheckedChange={(checked) => setForm({ ...form, importante: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="fixado">Fixar no Topo</Label>
              <Switch
                id="fixado"
                checked={form.fixado}
                onCheckedChange={(checked) => setForm({ ...form, fixado: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Comunicado Ativo</Label>
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
