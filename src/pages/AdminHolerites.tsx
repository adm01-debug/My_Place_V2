import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileUp,
  Search,
  Calendar,
  User,
  Trash2,
  Info
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ModuleHeader } from "@/components/layout/ModuleHeader";

interface UploadFile {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  progress: number;
  extractedInfo?: {
    cpf?: string;
    matricula?: string;
    competencia?: string;
    userId?: string;
    userName?: string;
  };
}

export default function AdminHolerites() {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [competenciaGlobal, setCompetenciaGlobal] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      status: "pending" as const,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "success") continue;

      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "uploading", progress: 10 } : f));

      try {
        const file = files[i].file;
        const fileName = file.name;
        
        // Regra de nomenclatura: CPF_COMPETENCIA.pdf ou MATRICULA_COMPETENCIA.pdf
        // Ex: 12345678900_2026-05.pdf ou 12345_2026-05.pdf
        const parts = fileName.replace(".pdf", "").split("_");
        const identifier = parts[0];
        const competencia = parts[1] || competenciaGlobal;

        if (!competencia) {
          throw new Error("Competência não encontrada no nome do arquivo e nem definida globalmente.");
        }

        // Buscar usuário
        const { data: profile, error: pError } = await supabase
          .from("profiles")
          .select("id, nome")
          .or(`cpf.eq.${identifier},matricula.eq.${identifier}`)
          .single();

        if (pError || !profile) {
          throw new Error("Colaborador não encontrado por CPF ou Matrícula.");
        }

        setFiles(prev => prev.map((f, idx) => idx === i ? { 
          ...f, 
          progress: 30,
          extractedInfo: { userId: profile.id, userName: profile.nome, competencia }
        } : f));

        // Upload to storage
        const filePath = `holerites/${profile.id}/${competencia}_${Date.now()}.pdf`;
        const { error: sError } = await supabase.storage
          .from("documentos")
          .upload(filePath, file);

        if (sError) throw sError;

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, progress: 70 } : f));

        // Criar registro na tabela holerites
        // Como não temos um parser de PDF aqui, vamos colocar valores zerados ou permitir edição depois
        // Em um sistema real 10/10, usaríamos um OCR ou parser no backend (Edge Function)
        const { error: hError } = await supabase
          .from("holerites")
          .insert({
            user_id: profile.id,
            competencia,
            arquivo_url: filePath,
            salario_bruto: 0, // Admin ajustará depois ou importará CSV
            salario_liquido: 0,
            inss: 0,
            irrf: 0,
            outros_descontos: 0
          });

        if (hError) throw hError;

        // Criar notificação respeitando preferências do usuário
        await supabase.rpc('fn_notificar', {
          _user_id: profile.id,
          _titulo: "Novo Holerite Disponível",
          _mensagem: `Seu holerite de ${competencia} já está disponível para visualização.`,
          _tipo: 'info',
          _categoria: 'holerite',
          _link: '/holerites',
          _nivel: 'info',
        });

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "success", progress: 100 } : f));
      } catch (err: any) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "error", error: err.message } : f));
      }
    }

    setIsProcessing(false);
    toast.success("Processamento concluído");
    queryClient.invalidateQueries({ queryKey: ["admin-recent-holerites"] });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 pt-6 pb-20 space-y-6">
      <ModuleHeader 
        title="Importação de Holerites" 
        description="Upload em lote de contracheques via PDF."
        icon={FileUp}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Configurações</CardTitle>
            <CardDescription>Defina os parâmetros para a importação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="competencia">Competência Padrão (AAAA-MM)</Label>
              <Input 
                id="competencia" 
                placeholder="2026-05" 
                value={competenciaGlobal}
                onChange={(e) => setCompetenciaGlobal(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground italic">
                Será usada caso não seja detectada no nome do arquivo.
              </p>
            </div>

            <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2 text-blue-500">
                <Info className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Regras de Nomenclatura</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Para mapeamento automático, nomeie os arquivos como:
                <br /><br />
                <strong>CPF_AAAA-MM.pdf</strong> (ex: 12345678900_2026-05.pdf)
                <br />ou<br />
                <strong>MATRICULA_AAAA-MM.pdf</strong> (ex: 10542_2026-05.pdf)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
              ${isDragActive ? "border-primary bg-primary/5 scale-[0.99]" : "border-border hover:border-primary/50 hover:bg-accent/30"}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileUp className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">Arraste os holerites (PDF) para cá</p>
                <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar arquivos do seu computador</p>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Fila de Upload ({files.length})</CardTitle>
                </div>
                <Button 
                  onClick={processFiles} 
                  disabled={isProcessing || files.every(f => f.status === 'success')}
                  size="sm"
                >
                  {isProcessing ? "Processando..." : "Iniciar Importação"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-border/40 bg-accent/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{f.file.name}</span>
                            {f.extractedInfo?.userName && (
                              <span className="text-[10px] text-primary flex items-center gap-1">
                                <User className="h-3 w-3" /> {f.extractedInfo.userName} ({f.extractedInfo.competencia})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {f.status === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                          {f.status === "error" && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-destructive font-medium max-w-[150px] truncate">{f.error}</span>
                              <AlertCircle className="h-5 w-5 text-destructive" />
                            </div>
                          )}
                          {f.status !== "uploading" && (
                            <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {(f.status === "uploading" || f.status === "success") && (
                        <Progress value={f.progress} className="h-1" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
