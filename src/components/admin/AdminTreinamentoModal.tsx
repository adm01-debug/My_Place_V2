import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categorias = ['Geral', 'Segurança', 'Técnico', 'Compliance', 'Liderança', 'Soft Skills', 'Onboarding', 'Outros'];

interface AdminTreinamentoModalProps {
  open: boolean;
  onClose: () => void;
  data?: any;
  onSave: (data: any) => Promise<void>;
}

export function AdminTreinamentoModal({ open, onClose, data, onSave }: AdminTreinamentoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: 'Geral',
    carga_horaria: 1,
    instrutor: '',
    conteudo_url: '',
    obrigatorio: false,
    ativo: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        categoria: data.categoria || 'Geral',
        carga_horaria: data.carga_horaria || 1,
        instrutor: data.instrutor || '',
        conteudo_url: data.conteudo_url || '',
        obrigatorio: data.obrigatorio || false,
        ativo: data.ativo !== false,
      });
    } else {
      setForm({
        titulo: '',
        descricao: '',
        categoria: 'Geral',
        carga_horaria: 1,
        instrutor: '',
        conteudo_url: '',
        obrigatorio: false,
        ativo: true,
      });
    }
  }, [data, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    setIsSubmitting(true);
    await onSave({
      ...form,
      instrutor: form.instrutor || null,
      conteudo_url: form.conteudo_url || null,
    });
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Treinamento' : 'Novo Treinamento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Nome do treinamento"
              maxLength={200}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="carga_horaria">Carga Horária</Label>
              <Input
                id="carga_horaria"
                type="number"
                min={1}
                max={999}
                value={form.carga_horaria}
                onChange={(e) => setForm({ ...form, carga_horaria: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrutor">Instrutor</Label>
            <Input
              id="instrutor"
              value={form.instrutor}
              onChange={(e) => setForm({ ...form, instrutor: e.target.value })}
              placeholder="Nome do instrutor (opcional)"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descrição do treinamento"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo_url">URL do Conteúdo</Label>
            <Input
              id="conteudo_url"
              type="url"
              value={form.conteudo_url}
              onChange={(e) => setForm({ ...form, conteudo_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="obrigatorio">Treinamento Obrigatório</Label>
              <Switch
                id="obrigatorio"
                checked={form.obrigatorio}
                onCheckedChange={(checked) => setForm({ ...form, obrigatorio: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Treinamento Ativo</Label>
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
