import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Camera, Loader2, User, Mail, Briefcase, Building2, Calendar, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Perfil() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [nome, setNome] = useState(profile?.nome || '');
  const [telefone, setTelefone] = useState(profile?.telefone || '');
  const [cpf, setCpf] = useState(profile?.cpf || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nome, telefone, cpf })
      .eq('id', user.id);
    if (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado!' });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Máximo 2MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Erro no upload', variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
    toast({ title: 'Avatar atualizado!' });
    setUploading(false);
  };

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const infoItems = [
    { icon: Mail, label: 'Email', value: profile?.email || user?.email },
    { icon: Briefcase, label: 'Cargo', value: profile?.cargo },
    { icon: Building2, label: 'Departamento', value: profile?.departamento },
    { icon: Hash, label: 'Matrícula', value: profile?.matricula },
    { icon: Calendar, label: 'Admissão', value: profile?.data_admissao ? new Date(profile.data_admissao + 'T12:00:00').toLocaleDateString('pt-BR') : null },
  ].filter(item => item.value);

  return (
    <div className="min-h-screen bg-background">
      {/* Header gradient */}
      <div className="relative h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full bg-background/50 backdrop-blur-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto px-4 -mt-16 pb-20 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <Avatar className="w-28 h-28 border-4 border-background shadow-xl">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <h2 className="text-xl font-bold text-foreground mt-3">{profile?.nome || 'Colaborador'}</h2>
          {profile?.cargo && (
            <Badge variant="secondary" className="mt-1 text-xs">{profile.cargo}</Badge>
          )}
        </div>

        {/* Editable name */}
        <Card className="p-4 border-border/50 shadow-md backdrop-blur-sm bg-card/80">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Nome Completo</Label>
            </div>
            <Input value={nome} onChange={e => setNome(e.target.value)} className="bg-background/50" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Telefone</Label>
                <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">CPF</Label>
                <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="bg-background/50" />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving || (nome === profile?.nome && telefone === profile?.telefone && cpf === profile?.cpf)} className="w-full gap-2 mt-4">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </Card>

        {/* Info cards */}
        {infoItems.length > 0 && (
          <Card className="p-4 border-border/50 shadow-md backdrop-blur-sm bg-card/80">
            <h3 className="text-sm font-semibold text-foreground mb-3">Informações Profissionais</h3>
            <div className="space-y-3">
              {infoItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
