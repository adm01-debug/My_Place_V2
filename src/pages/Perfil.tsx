import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Perfil() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [nome, setNome] = useState(profile?.nome || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nome })
      .eq('id', user.id);
    if (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado!' });
    }
    setSaving(false);
  };

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Meu Perfil</h1>
        </div>
        <div className="flex justify-center">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <div className="space-y-4">
          <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={profile?.email || user?.email || ''} disabled /></div>
          {profile?.cargo && <div><Label>Cargo</Label><Input value={profile.cargo} disabled /></div>}
          {profile?.departamento && <div><Label>Departamento</Label><Input value={profile.departamento} disabled /></div>}
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </Card>
    </div>
  );
}
