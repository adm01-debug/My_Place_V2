import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { ShieldCheck, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Politica {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  obrigatoria: boolean;
  ativa: boolean;
  versao_vigente_id: string | null;
}
interface Versao {
  id: string;
  politica_id: string;
  versao: number;
  conteudo: string;
  arquivo_url: string | null;
  changelog: string | null;
  publicada_em: string | null;
}
interface Aceite { versao_id: string; aceito_em: string; }

const CAT_LABEL: Record<string, string> = {
  codigo_conduta: 'Código de Conduta', lgpd: 'LGPD', seguranca: 'Segurança',
  beneficios: 'Benefícios', home_office: 'Home Office', compliance: 'Compliance', outros: 'Outros',
};

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Politicas() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const qc = useQueryClient();
  const [aberta, setAberta] = useState<{ pol: Politica; ver: Versao } | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  const { data: politicas = [] } = useQuery({
    queryKey: ['politicas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('politicas').select('*').eq('ativa', true).order('titulo');
      if (error) throw error;
      return data as Politica[];
    },
  });

  const { data: versoes = [] } = useQuery({
    queryKey: ['politicas-versoes'],
    queryFn: async () => {
      const ids = politicas.map(p => p.versao_vigente_id).filter(Boolean);
      if (!ids.length) return [];
      const { data, error } = await supabase.from('politicas_versoes').select('*').in('id', ids as string[]);
      if (error) throw error;
      return data as Versao[];
    },
    enabled: politicas.length > 0,
  });

  const { data: aceites = [] } = useQuery({
    queryKey: ['politicas-aceites', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('politicas_aceites').select('versao_id,aceito_em').eq('user_id', user!.id);
      if (error) throw error;
      return data as Aceite[];
    },
  });

  const aceitar = useMutation({
    mutationFn: async () => {
      if (!aberta || !user) return;
      const hash = await sha256(`${user.id}|${aberta.ver.id}|${aberta.ver.conteudo}`);
      const { error } = await supabase.from('politicas_aceites').insert({
        user_id: user.id,
        versao_id: aberta.ver.id,
        user_agent: navigator.userAgent.slice(0, 200),
        hash_integridade: hash,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Aceite registrado com sucesso!');
      qc.invalidateQueries({ queryKey: ['politicas-aceites'] });
      setAberta(null);
      setConfirmado(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isAceita = (verId: string | null) => !!verId && aceites.some(a => a.versao_id === verId);
  const pendentes = politicas.filter(p => p.obrigatoria && p.versao_vigente_id && !isAceita(p.versao_vigente_id));
  const jaAceitas = politicas.filter(p => isAceita(p.versao_vigente_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Políticas Corporativas</h1>
          <p className="text-sm text-muted-foreground">Leia e aceite eletronicamente as políticas em vigor.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertCircle className="w-8 h-8 text-orange-500" /><div><p className="text-xs text-muted-foreground">Pendentes de aceite</p><p className="text-2xl font-bold">{pendentes.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="w-8 h-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Aceitas</p><p className="text-2xl font-bold">{jaAceitas.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><FileText className="w-8 h-8 text-blue-500" /><div><p className="text-xs text-muted-foreground">Total ativas</p><p className="text-2xl font-bold">{politicas.length}</p></div></CardContent></Card>
      </div>

      {pendentes.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader><CardTitle className="text-base text-orange-600 dark:text-orange-400">Ação necessária</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendentes.map(p => {
              const ver = versoes.find(v => v.id === p.versao_vigente_id);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">v{ver?.versao} · {CAT_LABEL[p.categoria]}</p>
                  </div>
                  <Button size="sm" onClick={() => ver && setAberta({ pol: p, ver })}>Ler e aceitar</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Todas as políticas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {politicas.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma política publicada ainda.</p>}
          {politicas.map(p => {
            const ver = versoes.find(v => v.id === p.versao_vigente_id);
            const aceita = isAceita(p.versao_vigente_id);
            const aceite = aceites.find(a => a.versao_id === p.versao_vigente_id);
            return (
              <button key={p.id} onClick={() => ver && setAberta({ pol: p, ver })} className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{p.titulo}</p>
                      <Badge variant="outline">{CAT_LABEL[p.categoria]}</Badge>
                      {ver && <Badge variant="secondary">v{ver.versao}</Badge>}
                      {p.obrigatoria && <Badge className="bg-blue-500 text-white">Obrigatória</Badge>}
                    </div>
                    {p.descricao && <p className="text-xs text-muted-foreground mt-1">{p.descricao}</p>}
                  </div>
                  {aceita ? (
                    <div className="text-right">
                      <Badge className="bg-emerald-500 text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Aceita</Badge>
                      {aceite && <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(aceite.aceito_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>}
                    </div>
                  ) : (
                    <Badge variant="outline" className="border-orange-500 text-orange-600">Pendente</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!aberta} onOpenChange={(o) => { if (!o) { setAberta(null); setConfirmado(false); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          {aberta && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {aberta.pol.titulo}
                  <Badge variant="secondary">v{aberta.ver.versao}</Badge>
                </DialogTitle>
                {aberta.ver.publicada_em && (
                  <p className="text-xs text-muted-foreground">Publicada em {format(new Date(aberta.ver.publicada_em), "dd/MM/yyyy", { locale: ptBR })}</p>
                )}
              </DialogHeader>
              <ScrollArea className="flex-1 border rounded-lg p-4 max-h-[50vh]">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aberta.ver.conteudo}</div>
                {aberta.ver.arquivo_url && (
                  <a href={aberta.ver.arquivo_url} target="_blank" rel="noreferrer" className="text-primary underline text-sm mt-3 inline-block">
                    Baixar PDF oficial
                  </a>
                )}
              </ScrollArea>
              {isAceita(aberta.ver.id) ? (
                <p className="text-sm text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Você já aceitou esta versão.</p>
              ) : (
                <>
                  <label className="flex items-start gap-2 cursor-pointer text-sm">
                    <Checkbox checked={confirmado} onCheckedChange={(v) => setConfirmado(!!v)} className="mt-0.5" />
                    <span>Li, compreendi e concordo com esta política. Entendo que este aceite eletrônico é registrado com data, hora, dispositivo e hash de integridade para fins legais.</span>
                  </label>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAberta(null)}>Fechar</Button>
                    <Button onClick={() => aceitar.mutate()} disabled={!confirmado || aceitar.isPending}>Aceitar e assinar</Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {isAdmin && (
        <p className="text-xs text-muted-foreground text-center">
          💡 Administração de políticas e versões: gerencie pelo painel administrativo (em breve UI dedicada).
        </p>
      )}
    </div>
  );
}
