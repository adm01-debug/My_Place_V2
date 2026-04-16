import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Navigation,
  Shield,
  MapPinOff,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';

interface Local {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
  ativo: boolean;
}

interface FormData {
  nome: string;
  latitude: string;
  longitude: string;
  raio_metros: string;
  ativo: boolean;
}

const emptyForm: FormData = { nome: '', latitude: '', longitude: '', raio_metros: '200', ativo: true };

export default function AdminLocais() {
  const { user } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchLocais = useCallback(async () => {
    const { data, error } = await supabase
      .from('locais_permitidos')
      .select('id, nome, latitude, longitude, raio_metros, ativo')
      .order('nome');

    if (error) {
      console.error(error);
      toast.error('Erro ao carregar locais.');
    } else {
      setLocais(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLocais();
  }, [fetchLocais]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (local: Local) => {
    setEditingId(local.id);
    setForm({
      nome: local.nome,
      latitude: String(local.latitude),
      longitude: String(local.longitude),
      raio_metros: String(local.raio_metros),
      ativo: local.ativo,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const raio = parseInt(form.raio_metros, 10);

    if (!form.nome.trim()) { toast.error('Nome é obrigatório.'); return; }
    if (isNaN(lat) || lat < -90 || lat > 90) { toast.error('Latitude inválida (-90 a 90).'); return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { toast.error('Longitude inválida (-180 a 180).'); return; }
    if (isNaN(raio) || raio < 10) { toast.error('Raio mínimo: 10 metros.'); return; }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('locais_permitidos')
          .update({ nome: form.nome.trim(), latitude: lat, longitude: lng, raio_metros: raio, ativo: form.ativo })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Local atualizado!');
      } else {
        const { error } = await supabase
          .from('locais_permitidos')
          .insert({ nome: form.nome.trim(), latitude: lat, longitude: lng, raio_metros: raio, ativo: form.ativo });
        if (error) throw error;
        toast.success('Local criado!');
      }
      setDialogOpen(false);
      await fetchLocais();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar local.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from('locais_permitidos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Local removido!');
      await fetchLocais();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover local.');
    } finally {
      setDeleting(null);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success('Coordenadas capturadas!');
      },
      () => toast.error('Não foi possível obter a localização.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (rolesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-20 flex flex-col items-center gap-4">
        <Shield className="w-12 h-12 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Acesso Restrito</h1>
        <p className="text-sm text-muted-foreground text-center">
          Esta página é exclusiva para administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 pt-6 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locais Permitidos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os locais de registro de ponto</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Novo Local
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : locais.length === 0 ? (
        <Card className="border-border/50 shadow-lg">
          <CardContent className="flex flex-col items-center py-8 gap-3">
            <MapPinOff className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum local cadastrado.</p>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Cadastrar Primeiro Local
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {locais.map((local) => (
            <Card key={local.id} className="border-border/50 shadow-md">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  {/* Map thumbnail via OpenStreetMap static */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border/50 bg-muted">
                    <img
                      src={`https://static-maps.yandex.ru/v1?ll=${local.longitude},${local.latitude}&z=15&size=160,160&l=map&pt=${local.longitude},${local.latitude},pm2rdm`}
                      alt={`Mapa de ${local.nome}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">{local.nome}</h3>
                      <Badge
                        variant={local.ativo ? 'default' : 'secondary'}
                        className="text-[10px] px-1.5"
                      >
                        {local.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>{local.latitude.toFixed(4)}, {local.longitude.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Navigation className="w-3 h-3" />
                      <span>Raio: {local.raio_metros}m</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(local)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(local.id)}
                      disabled={deleting === local.id}
                    >
                      {deleting === local.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Visual map link */}
                <a
                  href={`https://www.google.com/maps?q=${local.latitude},${local.longitude}&z=17`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <MapPin className="w-3 h-3" />
                  Ver no Google Maps
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Local' : 'Novo Local'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Local</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Escritório Principal"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                  placeholder="-23.5505"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                  placeholder="-46.6333"
                />
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={useMyLocation}>
              <Navigation className="w-4 h-4" />
              Usar Minha Localização Atual
            </Button>
            <div>
              <Label htmlFor="raio">Raio Permitido (metros)</Label>
              <Input
                id="raio"
                type="number"
                min={10}
                value={form.raio_metros}
                onChange={(e) => setForm((f) => ({ ...f, raio_metros: e.target.value }))}
                placeholder="200"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Distância máxima para registro de ponto (mín. 10m)
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Local ativo</Label>
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, ativo: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
