import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, Wand2 } from 'lucide-react';
import type { AutoRule, RuleAction, RuleField } from '@/hooks/useAutoRules';

interface AutoRulesDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rules: AutoRule[];
  addRule: (r: Omit<AutoRule, 'id' | 'criado_em'>) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
}

const acaoLabel: Record<RuleAction, string> = {
  marcar_lida: 'Marcar como lida',
  fixar: 'Fixar no topo',
  excluir: 'Excluir automaticamente',
};

const campoLabel: Record<RuleField, string> = {
  qualquer: 'Qualquer campo',
  titulo: 'Título',
  mensagem: 'Mensagem',
  tipo: 'Tipo (erro/alerta/sucesso/info)',
};

export function AutoRulesDialog({
  open,
  onOpenChange,
  rules,
  addRule,
  removeRule,
  toggleRule,
}: AutoRulesDialogProps) {
  const [padrao, setPadrao] = useState('');
  const [campo, setCampo] = useState<RuleField>('qualquer');
  const [acao, setAcao] = useState<RuleAction>('marcar_lida');

  const handleAdd = () => {
    const p = padrao.trim();
    if (!p) return;
    addRule({ padrao: p, campo, acao, ativa: true });
    setPadrao('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" />
            Regras automáticas
          </DialogTitle>
          <DialogDescription>
            Aplicadas automaticamente a cada nova notificação recebida em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border border-border/50 rounded-lg p-3 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={campo} onValueChange={(v) => setCampo(v as RuleField)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(campoLabel) as RuleField[]).map((k) => (
                  <SelectItem key={k} value={k}>{campoLabel[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={acao} onValueChange={(v) => setAcao(v as RuleAction)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(acaoLabel) as RuleAction[]).map((k) => (
                  <SelectItem key={k} value={k}>{acaoLabel[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={campo === 'tipo' ? 'ex.: info' : 'termo a procurar…'}
              value={padrao}
              onChange={(e) => setPadrao(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={!padrao.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Criar
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {rules.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              Nenhuma regra criada ainda.
            </p>
          ) : (
            rules.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 border border-border/50 rounded-md p-2 bg-card"
              >
                <Switch checked={r.ativa} onCheckedChange={() => toggleRule(r.id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    Se <Badge variant="outline" className="mx-1 text-[10px]">{campoLabel[r.campo]}</Badge>
                    {r.campo === 'tipo' ? 'for' : 'contém'} <span className="font-mono">"{r.padrao}"</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    → {acaoLabel[r.acao]}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeRule(r.id)}
                  aria-label="Remover regra"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
