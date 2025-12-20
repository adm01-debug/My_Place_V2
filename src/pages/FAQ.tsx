import { useState } from 'react';
import { Search, ChevronDown, MessageCircle, Briefcase, Wallet, Calendar, Clock, Gift, FileText, Shield } from 'lucide-react';
import { PageLayout } from '@/components/portal/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FAQItem {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  tags: string[];
}

const categorias = [
  { id: 'todos', label: 'Todos', icon: Search, color: 'text-primary' },
  { id: 'rh', label: 'RH', icon: Briefcase, color: 'text-hr' },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet, color: 'text-finance' },
  { id: 'ferias', label: 'Férias', icon: Calendar, color: 'text-projects' },
  { id: 'ponto', label: 'Ponto', icon: Clock, color: 'text-primary' },
  { id: 'beneficios', label: 'Benefícios', icon: Gift, color: 'text-marketing' },
  { id: 'documentos', label: 'Documentos', icon: FileText, color: 'text-muted-foreground' },
  { id: 'seguranca', label: 'Segurança', icon: Shield, color: 'text-destructive' },
];

const faqData: FAQItem[] = [
  // RH
  {
    id: '1',
    pergunta: 'Como atualizar meus dados cadastrais?',
    resposta: 'Acesse a página "Meu Perfil" no menu principal. Lá você pode atualizar informações como foto, telefone e endereço. Para alterações de dados pessoais como nome ou CPF, abra uma solicitação ao RH através do menu "Minhas Solicitações".',
    categoria: 'rh',
    tags: ['cadastro', 'perfil', 'dados pessoais']
  },
  {
    id: '2',
    pergunta: 'Como solicitar uma declaração de vínculo empregatício?',
    resposta: 'Vá em "Minhas Solicitações" e selecione o tipo "Declaração". Preencha os dados necessários indicando a finalidade (banco, imobiliária, etc.). O prazo de entrega é de até 3 dias úteis e você será notificado quando estiver disponível em "Meus Documentos".',
    categoria: 'rh',
    tags: ['declaração', 'documento', 'comprovante']
  },
  {
    id: '3',
    pergunta: 'Qual o processo para promoção ou mudança de cargo?',
    resposta: 'Promoções são avaliadas semestralmente com base em desempenho, metas atingidas e competências desenvolvidas. Converse com seu gestor sobre seu plano de desenvolvimento. A empresa também divulga vagas internas através dos comunicados.',
    categoria: 'rh',
    tags: ['promoção', 'carreira', 'crescimento']
  },
  // Financeiro
  {
    id: '4',
    pergunta: 'Quando é pago o salário?',
    resposta: 'O salário é depositado todo dia 5 do mês subsequente. Caso o dia 5 caia em fim de semana ou feriado, o pagamento é antecipado para o último dia útil anterior. O holerite fica disponível no portal 2 dias antes do pagamento.',
    categoria: 'financeiro',
    tags: ['salário', 'pagamento', 'holerite']
  },
  {
    id: '5',
    pergunta: 'Como funciona o empréstimo consignado?',
    resposta: 'O empréstimo consignado tem taxa de juros reduzida (a partir de 1,5% a.m.) e desconto direto em folha. Você pode solicitar até 30% do seu salário líquido em parcelas. Acesse "Empréstimos" para simular valores e fazer sua solicitação.',
    categoria: 'financeiro',
    tags: ['empréstimo', 'consignado', 'crédito']
  },
  {
    id: '6',
    pergunta: 'Como consultar meu holerite?',
    resposta: 'Acesse "Meus Holerites" no menu. Você pode visualizar os holerites de todos os meses, ver o detalhamento de proventos e descontos, e baixar o PDF para impressão. Os holerites ficam disponíveis 2 dias antes do pagamento.',
    categoria: 'financeiro',
    tags: ['holerite', 'contracheque', 'pagamento']
  },
  {
    id: '7',
    pergunta: 'Como funciona o 13º salário?',
    resposta: 'O 13º é pago em duas parcelas: a primeira até 30 de novembro (50% sem descontos) e a segunda até 20 de dezembro (50% com descontos de INSS e IRRF). Você pode solicitar o adiantamento da 1ª parcela junto com as férias.',
    categoria: 'financeiro',
    tags: ['13º', 'décimo terceiro', 'gratificação']
  },
  // Férias
  {
    id: '8',
    pergunta: 'Como solicitar férias?',
    resposta: 'Acesse "Minhas Férias", verifique seu saldo de dias disponíveis e clique em "Solicitar Férias". Escolha o período desejado (mínimo 5 dias) e aguarde a aprovação do seu gestor. Recomendamos solicitar com pelo menos 30 dias de antecedência.',
    categoria: 'ferias',
    tags: ['férias', 'solicitar', 'descanso']
  },
  {
    id: '9',
    pergunta: 'Posso vender parte das minhas férias?',
    resposta: 'Sim! Você pode vender até 1/3 das férias (10 dias se tiver direito a 30). Isso é chamado de "abono pecuniário". Marque essa opção ao solicitar suas férias. O valor é calculado proporcionalmente ao salário + 1/3 constitucional.',
    categoria: 'ferias',
    tags: ['férias', 'vender', 'abono']
  },
  {
    id: '10',
    pergunta: 'Quanto vou receber nas férias?',
    resposta: 'Você recebe o salário proporcional aos dias de férias + 1/3 constitucional. Se optar pelo abono pecuniário ou adiantamento do 13º, esses valores são somados. Use nossa "Calculadora" para simular o valor líquido que irá receber.',
    categoria: 'ferias',
    tags: ['férias', 'pagamento', 'cálculo']
  },
  // Ponto
  {
    id: '11',
    pergunta: 'Como registrar meu ponto?',
    resposta: 'Acesse "Meu Ponto" e clique no botão de registrar. O sistema captura sua localização para validar se você está em um local autorizado. Registre entrada, saída para almoço, retorno do almoço e saída. Você pode adicionar observações se necessário.',
    categoria: 'ponto',
    tags: ['ponto', 'registro', 'entrada', 'saída']
  },
  {
    id: '12',
    pergunta: 'Esqueci de bater o ponto, o que fazer?',
    resposta: 'Acesse "Meu Ponto" e vá em "Justificativas". Selecione a data, o tipo de ocorrência (esquecimento) e descreva o motivo. Anexe documentos se necessário. Seu gestor receberá a solicitação para aprovação.',
    categoria: 'ponto',
    tags: ['ponto', 'esquecimento', 'justificativa']
  },
  {
    id: '13',
    pergunta: 'Como justificar uma falta ou atraso?',
    resposta: 'Em "Meu Ponto", acesse "Justificativas" e registre a ocorrência informando data, tipo (atestado, atraso, falta) e motivo. Para atestados médicos, anexe o documento digitalizado. Justificativas são analisadas em até 48h úteis.',
    categoria: 'ponto',
    tags: ['falta', 'atraso', 'atestado', 'justificativa']
  },
  // Benefícios
  {
    id: '14',
    pergunta: 'Quais benefícios a empresa oferece?',
    resposta: 'Oferecemos: Vale Alimentação/Refeição, Plano de Saúde (extensivo a dependentes), Plano Odontológico, Seguro de Vida, Vale Transporte, Auxílio Creche e Gympass. Consulte "Meus Benefícios" para detalhes de cada um.',
    categoria: 'beneficios',
    tags: ['benefícios', 'plano de saúde', 'vale']
  },
  {
    id: '15',
    pergunta: 'Como incluir dependentes no plano de saúde?',
    resposta: 'Acesse "Meus Benefícios", selecione o plano de saúde e clique em "Adicionar Dependente". Informe os dados e anexe documentos comprobatórios (certidão de nascimento/casamento). A inclusão é processada em até 5 dias úteis.',
    categoria: 'beneficios',
    tags: ['dependente', 'plano de saúde', 'inclusão']
  },
  {
    id: '16',
    pergunta: 'Como funciona o vale alimentação/refeição?',
    resposta: 'O crédito é depositado todo dia 1º do mês no cartão benefício. O valor varia conforme cargo e região. Você pode consultar saldo e extrato no app da operadora. Em "Meus Benefícios" você vê o número do cartão e valor mensal.',
    categoria: 'beneficios',
    tags: ['VA', 'VR', 'alimentação', 'refeição']
  },
  // Documentos
  {
    id: '17',
    pergunta: 'Onde encontro meus documentos?',
    resposta: 'Acesse "Meus Documentos" para ver contratos, termos, comprovantes de rendimentos, declarações e outros documentos. Você pode filtrar por tipo e baixar em PDF. Novos documentos geram notificações automáticas.',
    categoria: 'documentos',
    tags: ['documentos', 'contrato', 'comprovante']
  },
  {
    id: '18',
    pergunta: 'Como obter o informe de rendimentos?',
    resposta: 'O informe de rendimentos para declaração de IR fica disponível em "Meus Documentos" a partir de fevereiro de cada ano, referente ao ano anterior. Você será notificado assim que estiver disponível.',
    categoria: 'documentos',
    tags: ['informe', 'rendimentos', 'imposto de renda', 'IR']
  },
  // Segurança
  {
    id: '19',
    pergunta: 'Como alterar minha senha de acesso?',
    resposta: 'Acesse "Meu Perfil" e vá em "Segurança" ou "Alterar Senha". Digite sua senha atual e a nova senha (mínimo 8 caracteres com letras e números). Por segurança, você será deslogado dos outros dispositivos.',
    categoria: 'seguranca',
    tags: ['senha', 'segurança', 'acesso']
  },
  {
    id: '20',
    pergunta: 'Meus dados estão seguros no portal?',
    resposta: 'Sim! Utilizamos criptografia de ponta a ponta, autenticação segura e todas as informações são protegidas conforme a LGPD. Seus dados só são acessíveis por você e setores autorizados do RH/DP quando necessário.',
    categoria: 'seguranca',
    tags: ['segurança', 'privacidade', 'LGPD', 'dados']
  },
];

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');

  const faqFiltrado = faqData.filter(item => {
    const matchCategoria = categoriaAtiva === 'todos' || item.categoria === categoriaAtiva;
    const matchSearch = searchTerm === '' || 
      item.pergunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.resposta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategoria && matchSearch;
  });

  const getCategoriaInfo = (categoriaId: string) => {
    return categorias.find(c => c.id === categoriaId) || categorias[0];
  };

  return (
    <PageLayout title="FAQ">
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Perguntas Frequentes</h2>
                <p className="text-sm text-muted-foreground">
                  Encontre respostas rápidas para suas dúvidas mais comuns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pergunta, palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categorias */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categorias.map((cat) => {
            const Icon = cat.icon;
            const isActive = categoriaAtiva === cat.id;
            return (
              <Button
                key={cat.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoriaAtiva(cat.id)}
                className="shrink-0 gap-2"
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Resultados */}
        {faqFiltrado.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Nenhum resultado encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tente buscar com outras palavras ou use o assistente virtual
              </p>
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Perguntar ao Assistente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {faqFiltrado.length} {faqFiltrado.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </p>
            
            <Accordion type="single" collapsible className="space-y-2">
              {faqFiltrado.map((item) => {
                const catInfo = getCategoriaInfo(item.categoria);
                const CatIcon = catInfo.icon;
                return (
                  <AccordionItem 
                    key={item.id} 
                    value={item.id}
                    className="border rounded-lg bg-card px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-start gap-3 text-left">
                        <div className={`p-2 rounded-lg ${catInfo.color.replace('text-', 'bg-')}/10 shrink-0`}>
                          <CatIcon className={`h-4 w-4 ${catInfo.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{item.pergunta}</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {catInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="pl-12">
                        <p className="text-muted-foreground leading-relaxed">
                          {item.resposta}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-muted"
                              onClick={() => setSearchTerm(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}

        {/* CTA Assistente */}
        <Card className="bg-muted/50 border-muted">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Não encontrou sua resposta?</h3>
                <p className="text-sm text-muted-foreground">
                  Use o assistente virtual de RH para tirar suas dúvidas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default FAQ;
