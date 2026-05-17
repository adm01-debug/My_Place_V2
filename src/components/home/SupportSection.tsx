import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserCircle, HeartHandshake, HelpCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function SupportSection() {
  const { profile } = useAuth();
  const [gestor, setGestor] = useState<{ nome: string; avatar_url: string | null; cargo: string | null } | null>(null);

  useEffect(() => {
    if (profile?.gestor_id) {
      const fetchGestor = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('nome, avatar_url, cargo')
          .eq('id', profile.gestor_id)
          .single();
        if (data) setGestor(data);
      };
      fetchGestor();
    }
  }, [profile?.gestor_id]);

  if (!profile) return null;

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Suporte & Equipe</h3>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border/50">
        {/* Direct Manager */}
        <div className="p-4 flex items-center justify-between group hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 border border-border shadow-sm">
                <AvatarImage src={gestor?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {gestor?.nome ? gestor.nome.substring(0, 2).toUpperCase() : <UserCircle className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Gestor Direto</p>
              <p className="text-sm font-semibold text-foreground">{gestor?.nome || 'Não definido'}</p>
              <p className="text-[11px] text-muted-foreground">{gestor?.cargo || 'Responsável'}</p>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* HR Responsible */}
        <div className="p-4 flex items-center justify-between group hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <HeartHandshake className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">RH Responsável</p>
              <p className="text-sm font-semibold text-foreground">{profile.rh_responsavel || 'Equipe RH'}</p>
              <p className="text-[11px] text-muted-foreground">Fale conosco para dúvidas</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-600 dark:text-rose-400">Atendimento</Badge>
        </div>

        {/* Department Support */}
        <div className="p-4 flex items-center justify-between group hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <HelpCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Apoio Departamento</p>
              <p className="text-sm font-semibold text-foreground">{profile.apoio_departamento || profile.departamento || 'Equipe Técnica'}</p>
              <p className="text-[11px] text-muted-foreground">Suporte operacional</p>
            </div>
          </div>
          <button className="text-[11px] font-semibold text-primary hover:underline">Solicitar Ajuda</button>
        </div>
      </CardContent>
    </Card>
  );
}
