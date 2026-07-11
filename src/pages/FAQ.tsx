import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/portal/EmptyState";
import { HelpCircle, Search } from "lucide-react";

interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string | null;
  prioridade: number | null;
}

export default function FAQ() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  const { data: itens, isLoading } = useQuery({
    queryKey: ["faq"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq")
        .select("id, pergunta, resposta, categoria, prioridade")
        .order("prioridade", { ascending: false })
        .order("pergunta", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FaqItem[];
    },
  });

  const categorias = useMemo(() => {
    const set = new Set<string>();
    itens?.forEach((i) => i.categoria && set.add(i.categoria));
    return Array.from(set).sort();
  }, [itens]);

  const filtrados = useMemo(() => {
    if (!itens) return [];
    const termo = busca.trim().toLowerCase();
    return itens.filter((i) => {
      const casaCategoria = !categoria || i.categoria === categoria;
      const casaBusca =
        !termo ||
        i.pergunta.toLowerCase().includes(termo) ||
        i.resposta.toLowerCase().includes(termo);
      return casaCategoria && casaBusca;
    });
  }, [itens, busca, categoria]);

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={HelpCircle}
        title="Perguntas Frequentes"
        description="Encontre respostas rápidas para as dúvidas mais comuns."
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar perguntas ou respostas..."
          className="pl-10"
          aria-label="Buscar no FAQ"
        />
      </div>

      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={categoria === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategoria(null)}
          >
            Todas
          </Badge>
          {categorias.map((c) => (
            <Badge
              key={c}
              variant={categoria === c ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => setCategoria(c)}
            >
              {c}
            </Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Nenhuma pergunta encontrada"
          description="Tente outro termo ou selecione uma categoria diferente."
        />
      ) : (
        <Accordion type="single" collapsible className="rounded-lg border bg-card">
          {filtrados.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="px-4">
              <AccordionTrigger className="text-left font-medium">
                {item.pergunta}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground whitespace-pre-line">
                {item.resposta}
                {item.categoria && (
                  <div className="mt-3">
                    <Badge variant="secondary" className="capitalize">
                      {item.categoria}
                    </Badge>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
