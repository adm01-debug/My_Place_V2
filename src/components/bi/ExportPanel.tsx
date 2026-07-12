import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExportPanelProps {
  meses: number;
}

type Dataset = "headcount" | "absenteismo" | "custo" | "turnover" | "engajamento" | "compliance";

const DATASETS: Dataset[] = ["headcount", "absenteismo", "custo", "turnover", "engajamento", "compliance"];

export function ExportPanel({ meses }: ExportPanelProps) {
  const [loading, setLoading] = useState<"xlsx" | "csv" | null>(null);

  const handleExport = async (format: "xlsx" | "csv") => {
    setLoading(format);
    try {
      const { data, error } = await supabase.functions.invoke("bi-export", {
        body: { datasets: DATASETS, format, meses },
      });
      if (error) throw error;

      // Se o resultado for binário (Blob), o SDK retorna diretamente
      const blob =
        data instanceof Blob
          ? data
          : new Blob([data as BlobPart], {
              type:
                format === "xlsx"
                  ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  : "text/csv",
            });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bi-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao exportar";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("xlsx")}
        disabled={loading !== null}
        className="gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        {loading === "xlsx" ? "Gerando..." : "Exportar XLSX"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("csv")}
        disabled={loading !== null}
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        {loading === "csv" ? "Gerando..." : "Exportar CSV"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.print()}
        className="gap-2 text-muted-foreground"
      >
        <Download className="w-4 h-4" />
        Imprimir / PDF
      </Button>
    </div>
  );
}
