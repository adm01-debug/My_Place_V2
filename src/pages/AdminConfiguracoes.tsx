import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getErrorMessage } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Settings, 
  Upload, 
  Palette, 
  Building2, 
  Save,
  Loader2,
  Trash2
} from "lucide-react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminConfiguracoes() {
  const [config, setConfig] = useState<Database["public"]["Tables"]["configuracoes_globais"]["Row"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      const { data, error } = await supabase
        .from("configuracoes_globais")
        .select("*")
        .single();
      
      if (data) setConfig(data);
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    try {
      let logo_url = config.logo_url;

      // Upload logo if changed
      if (logoFile) {
        const filePath = `brand/logo_${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(filePath, logoFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("documentos")
          .getPublicUrl(filePath);
          
        logo_url = publicUrl;
      }

      const { error } = await supabase
        .from("configuracoes_globais")
        .update({
          nome_empresa: config.nome_empresa,
          cor_primaria: config.cor_primaria,
          logo_url,
          updated_at: new Date().toISOString()
        })
        .eq("id", config.id);

      if (error) throw error;
      
      toast.success("Configurações salvas com sucesso!");
      // Optionally reload to apply changes globally
      window.location.reload();
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <ModuleHeader 
        title="Configurações do Sistema" 
        description="Personalize a identidade visual e informações da empresa."
        icon={Settings}
        actions={
          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identidade Visual */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Identidade Visual
            </CardTitle>
            <CardDescription>Logo e nome que aparecerão no portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_empresa">Nome da Empresa</Label>
              <Input 
                id="nome_empresa" 
                value={config?.nome_empresa || ""} 
                onChange={(e) => setConfig((prev) => prev && { ...prev, nome_empresa: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Logo da Empresa</Label>
              <div className="flex items-start gap-4 p-4 border rounded-lg bg-accent/20">
                <div className="w-16 h-16 rounded-lg bg-card flex items-center justify-center border overflow-hidden shrink-0">
                  {logoFile ? (
                    <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-contain" />
                  ) : config?.logo_url ? (
                    <img src={config.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="text-xs h-9 cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Recomendado: PNG ou SVG com fundo transparente (min. 200x200px).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personalização de Cores */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Cores do Sistema
            </CardTitle>
            <CardDescription>Defina a cor primária para botões e elementos de destaque.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cor_primaria">Cor Primária (Hex)</Label>
              <div className="flex gap-2">
                <Input 
                  id="cor_primaria" 
                  type="color" 
                  value={config?.cor_primaria || "#0ea5e9"} 
                  onChange={(e) => setConfig((prev) => prev && { ...prev, cor_primaria: e.target.value })}
                  className="w-12 h-10 p-1 rounded-md"
                />
                <Input 
                  value={config?.cor_primaria || "#0ea5e9"} 
                  onChange={(e) => setConfig((prev) => prev && { ...prev, cor_primaria: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <h4 className="text-sm font-semibold mb-2">Prévia do Botão</h4>
              <Button style={{ backgroundColor: config?.cor_primaria }} className="w-full">
                Exemplo de Botão
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
