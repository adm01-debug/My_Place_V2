import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  FileSpreadsheet, 
  Download, 
  Calendar as CalendarIcon,
  Filter,
  Users,
  Clock,
  Palmtree,
  FileText,
  Loader2
} from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminRelatorios() {
  const [dateStart, setDateStart] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
  const [dateEnd, setDateEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, `${fileName}_${format(new Date(), "ddMMyyyy_HHmm")}.xlsx`);
  };

  const handleExportPonto = async () => {
    setIsExporting("ponto");
    try {
      const { data, error } = await supabase
        .from("registros_ponto")
        .select(`
          data_hora,
          tipo,
          latitude,
          longitude,
          endereco,
          observacao,
          profiles (
            nome,
            matricula,
            email
          )
        `)
        .gte("data_hora", `${dateStart}T00:00:00`)
        .lte("data_hora", `${dateEnd}T23:59:59`)
        .order("data_hora", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info("Nenhum registro encontrado no período selecionado.");
        return;
      }

      const formattedData = data.map((item: any) => ({
        "Colaborador": item.profiles?.nome,
        "Matrícula": item.profiles?.matricula,
        "Email": item.profiles?.email,
        "Data/Hora": format(new Date(item.data_hora), "dd/MM/yyyy HH:mm:ss"),
        "Tipo": item.tipo,
        "Endereço": item.endereco,
        "Observação": item.observacao || ""
      }));

      exportToExcel(formattedData, "Relatorio_Ponto");
      toast.success("Relatório de ponto exportado!");
    } catch (err: any) {
      toast.error(`Erro ao exportar: ${err.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportFerias = async () => {
    setIsExporting("ferias");
    try {
      const { data, error } = await supabase
        .from("solicitacoes_ferias")
        .select(`
          data_inicio,
          data_fim,
          dias,
          tipo,
          status,
          observacao,
          created_at,
          profiles (
            nome,
            matricula
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = data.map((item: any) => ({
        "Colaborador": item.profiles?.nome,
        "Matrícula": item.profiles?.matricula,
        "Data Início": format(new Date(item.data_inicio), "dd/MM/yyyy"),
        "Data Fim": format(new Date(item.data_fim), "dd/MM/yyyy"),
        "Dias": item.dias,
        "Tipo": item.tipo,
        "Status": item.status,
        "Observação": item.observacao || "",
        "Data Solicitação": format(new Date(item.created_at), "dd/MM/yyyy HH:mm")
      }));

      exportToExcel(formattedData, "Relatorio_Ferias");
      toast.success("Relatório de férias exportado!");
    } catch (err: any) {
      toast.error(`Erro ao exportar: ${err.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportSolicitacoes = async () => {
    setIsExporting("solicitacoes");
    try {
      const { data, error } = await supabase
        .from("solicitacoes")
        .select(`
          tipo,
          descricao,
          status,
          prioridade,
          created_at,
          profiles (
            nome,
            matricula
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = data.map((item: any) => ({
        "Colaborador": item.profiles?.nome,
        "Matrícula": item.profiles?.matricula,
        "Tipo": item.tipo,
        "Descrição": item.descricao,
        "Status": item.status,
        "Prioridade": item.prioridade,
        "Data Solicitação": format(new Date(item.created_at), "dd/MM/yyyy HH:mm")
      }));

      exportToExcel(formattedData, "Relatorio_Solicitacoes");
      toast.success("Relatório de solicitações exportado!");
    } catch (err: any) {
      toast.error(`Erro ao exportar: ${err.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatórios Gerenciais</h1>
        <p className="text-muted-foreground">Exporte dados consolidados do sistema para análise em Excel.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros Globais
          </CardTitle>
          <CardDescription>Defina o período para os relatórios temporais (Ponto, etc).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-start">Data Inicial</Label>
              <Input 
                id="date-start" 
                type="date" 
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-end">Data Final</Label>
              <Input 
                id="date-end" 
                type="date" 
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Relatório de Ponto */}
        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Registros de Ponto</CardTitle>
            <CardDescription className="text-xs">
              Histórico completo de entradas e saídas no período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full gap-2" 
              variant="outline" 
              onClick={handleExportPonto}
              disabled={!!isExporting}
            >
              {isExporting === "ponto" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-500" />}
              Exportar Ponto
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Férias */}
        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
              <Palmtree className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-base">Gestão de Férias</CardTitle>
            <CardDescription className="text-xs">
              Todas as solicitações, períodos aprovados e históricos de férias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full gap-2" 
              variant="outline" 
              onClick={handleExportFerias}
              disabled={!!isExporting}
            >
              {isExporting === "ferias" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-500" />}
              Exportar Férias
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Solicitações */}
        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            <CardTitle className="text-base">Central de Solicitações</CardTitle>
            <CardDescription className="text-xs">
              Relatório de pedidos, declarações e chamados ao RH.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full gap-2" 
              variant="outline" 
              onClick={handleExportSolicitacoes}
              disabled={!!isExporting}
            >
              {isExporting === "solicitacoes" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-500" />}
              Exportar Solicitações
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-muted/30 rounded-xl border border-border/50 flex gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
          <Download className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h4 className="text-sm font-semibold">Dica Enterprise</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Os arquivos exportados estão no formato padrão Excel (.xlsx) e podem ser importados diretamente em softwares de folha de pagamento ou sistemas de BI como Power BI e Tableau.
          </p>
        </div>
      </div>
    </div>
  );
}
