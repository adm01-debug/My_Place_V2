import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Camera, Loader2, Shield, Briefcase, Building2, Hash, Calendar, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Perfil() {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState(profile?.nome || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!user || !nome.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nome: nome.trim() })
      .eq('id', user.id);
    if (error) {
      toast.error('Erro ao salvar perfil.');
    } else {
      toast.success('Perfil atualizado com sucesso!');
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB.');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Erro ao fazer upload: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + '?t=' + Date.now();

    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
    toast.success('Foto atualizada!');
    setUploading(false);
    window.location.reload();
  };

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    colaborador: 'Colaborador',
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

  const infoItems = [
    { icon: Mail, label: 'Email', value: profile?.email || user?.email || '—' },
    { icon: Briefcase, label: 'Cargo', value: profile?.cargo || '—' },
    { icon: Building2, label: 'Departamento', value: profile?.departamento || '—' },
    { icon: Hash, label: 'Matrícula', value: profile?.matricula || '—' },
    { icon: Calendar, label: 'Admissão', value: formatDate(profile?.data_admissao || null) },
  ].filter(item => item.value !== '—');

  return (
    <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-20 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Meu Perfil</h1>
      </div>

      {/* Avatar + Name */}
      <Card className="border-border/50 shadow-xl overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary to-primary/60 dark:from-primary/80 dark:to-primary/30" />
        <CardContent className="relative pt-0 pb-6 -mt-10">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.nome || ''} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">{profile?.nome || 'Colaborador'}</h2>
              <Badge variant="secondary" className="gap-1">
                <Shield className="w-3 h-3" />
                {roleLabel[role] || 'Colaborador'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Name */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Editar Dados
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome completo</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
          </div>
          <Button onClick={handleSave} disabled={saving || !nome.trim()} className="w-full gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      {infoItems.length > 0 && (
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Informações Profissionais
            </h3>
          </CardHeader>
          <CardContent className="space-y-1">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
