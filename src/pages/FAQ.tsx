import { useState, useEffect } from 'react';
import { Search, ChevronDown, MessageCircle, Briefcase, Wallet, Calendar, Clock, Gift, FileText, Shield, BookOpen, HelpCircle, ThumbsUp, ThumbsDown, Loader2, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/portal/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useFAQ } from '@/hooks/useFAQ';
import { useToast } from '@/hooks/use-toast';

const categoriaIcons: Record<string, any> = {
  todos: Search,
  rh: Briefcase,
  financeiro: Wallet,
  ferias: Calendar,
  ponto: Clock,
  beneficios: Gift,
  documentos: FileText,
  seguranca: Shield,
  treinamentos: BookOpen,
  geral: HelpCircle,
};

const categoriaColors: Record<string, string> = {
  rh: 'text-hr',
  financeiro: 'text-finance',
  ferias: 'text-projects',
  ponto: 'text-primary',
  beneficios: 'text-marketing',
  documentos: 'text-muted-foreground',
  seguranca: 'text-destructive',
  treinamentos: 'text-primary',
  geral: 'text-muted-foreground',
};

export default function FAQ() {
  const {
    faqs,
    faqsDestaque,
    categorias,
    isLoading,
    error,
    searchTerm,
    categoriaAtiva,
    setSearchTerm,
    setCategoriaAtiva,
    incrementarVisualizacao,
    registrarUtilidade,
    getFAQsRelacionadas,
    refetch,
  } = useFAQ();

  const { toast } = useToast();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  // Ao expandir uma FAQ, incrementa visualização
  const handleExpand = (faqId: string) => {
    if (expandedItem !== faqId) {
      setExpandedItem(faqId);
      incrementarVisualizacao(faqId);
    } else {
      setExpandedItem(null);
    }
  };

  // Registrar feedback
  const handleFeedback = async (faqId: string, util: boolean) => {
    if (feedbackGiven.has(faqId)) {
      toast({
        title: 'Feedback já registrado',
        description: 'Você já avaliou esta resposta.',
      });
      return;
    }

    const result = await registrarUtilidade(faqId, util);
    
    if (result.success) {
      setFeedbackGiven(prev => new Set(prev).add(faqId));
      toast({
        title: 'Obrigado pelo feedback!',
        description: util 
          ? 'Ficamos felizes em ajudar.' 
          : 'Vamos trabalhar para melhorar esta resposta.',
      });
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="FAQ" showBack>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-8 w-20 flex-shrink-0" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="FAQ" showBack>
        <Card className="p-6 text-center">
          <p className="text-destructive mb-4">Erro ao carregar FAQs: {error}</p>
          <Button onClick={refetch}>Tentar novamente</Button>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="FAQ" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header com busca */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Como podemos ajudar?</h2>
            <p className="text-sm text-muted-foreground">
              {faqs.length} perguntas frequentes disponíveis
            </p>
          </div>
        </div>

        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pergunta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* FAQs em destaque */}
        {!searchTerm && categoriaAtiva === 'todos' && faqsDestaque.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              MAIS CONSULTADAS
            </h3>
            <div className="space-y-2">
              {faqsDestaque.map(faq => {
                const Icon = categoriaIcons[faq.categoria] || HelpCircle;
                return (
                  <Card 
                    key={faq.id} 
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setCategoriaAtiva(faq.categoria);
                      setExpandedItem(faq.id);
                      incrementarVisualizacao(faq.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${categoriaColors[faq.categoria] || 'text-primary'}`} />
                      </div>
                      <p className="text-sm font-medium text-foreground flex-1">{faq.pergunta}</p>
                      <Badge variant="secondary" className="text-xs">
                        {faq.visualizacoes}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs de categorias */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {categorias.map(cat => {
              const Icon = categoriaIcons[cat.id] || HelpCircle;
              const isActive = categoriaAtiva === cat.id;
              
              return (
                <Button
                  key={cat.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className="flex items-center gap-1.5"
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                  {cat.count > 0 && (
                    <Badge 
                      variant={isActive ? "secondary" : "outline"} 
                      className="text-xs ml-1"
                    >
                      {cat.count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Lista de FAQs */}
        {faqs.length === 0 ? (
          <Card className="p-8 text-center">
            <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm 
                ? `Nenhum resultado encontrado para "${searchTerm}"` 
                : 'Nenhuma pergunta nesta categoria'}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchTerm('')}
              >
                Limpar busca
              </Button>
            )}
          </Card>
        ) : (
          <Accordion 
            type="single" 
            collapsible 
            value={expandedItem || undefined}
            onValueChange={(value) => {
              if (value) {
                handleExpand(value);
              } else {
                setExpandedItem(null);
              }
            }}
            className="space-y-2"
          >
            {faqs.map(faq => {
              const Icon = categoriaIcons[faq.categoria] || HelpCircle;
              const relacionadas = getFAQsRelacionadas(faq.id);
              const hasFeedback = feedbackGiven.has(faq.id);
              
              return (
                <AccordionItem 
                  key={faq.id} 
                  value={faq.id}
                  className="border rounded-lg px-4 data-[state=open]:bg-muted/30"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <div className="flex items-start gap-3 flex-1 pr-4">
                      <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${categoriaColors[faq.categoria] || 'text-primary'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{faq.pergunta}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {faq.categoria}
                          </Badge>
                          {faq.destaque && (
                            <Badge variant="default" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="pl-11 space-y-4">
                      {/* Resposta */}
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <p className="whitespace-pre-line">{faq.resposta}</p>
                      </div>

                      {/* Tags */}
                      {faq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {faq.tags.map(tag => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => setSearchTerm(tag)}
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Feedback */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Esta resposta foi útil?
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={hasFeedback ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => handleFeedback(faq.id, true)}
                            disabled={hasFeedback}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Sim ({faq.utilidade_positiva})
                          </Button>
                          <Button
                            variant={hasFeedback ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => handleFeedback(faq.id, false)}
                            disabled={hasFeedback}
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Não ({faq.utilidade_negativa})
                          </Button>
                        </div>
                      </div>

                      {/* FAQs relacionadas */}
                      {relacionadas.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">
                            Perguntas relacionadas:
                          </p>
                          <div className="space-y-1">
                            {relacionadas.map(rel => (
                              <button
                                key={rel.id}
                                onClick={() => {
                                  setExpandedItem(rel.id);
                                  incrementarVisualizacao(rel.id);
                                }}
                                className="block text-left text-sm text-primary hover:underline"
                              >
                                → {rel.pergunta}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Assistente Virtual */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Não encontrou o que procurava?</p>
              <p className="text-sm text-muted-foreground">
                Fale com nosso assistente virtual ou abra uma solicitação ao RH.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" asChild>
              <a href="/solicitacoes">Abrir solicitação</a>
            </Button>
            <Button className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Assistente Virtual
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
