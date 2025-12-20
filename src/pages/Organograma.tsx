import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Users, User, Building2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageLayout } from '@/components/portal/PageLayout';
import { useOrganograma, ColaboradorOrganograma } from '@/hooks/useOrganograma';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface OrgNodeProps {
  node: ColaboradorOrganograma;
  level: number;
  onSelect: (node: ColaboradorOrganograma) => void;
  selectedId?: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

const OrgNode = ({ node, level, onSelect, selectedId, expandedIds, onToggle }: OrgNodeProps) => {
  const hasSubordinados = node.subordinados && node.subordinados.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const initials = node.nome
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const levelColors = [
    'border-l-primary',
    'border-l-hr',
    'border-l-finance',
    'border-l-projects',
    'border-l-marketing',
  ];

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.05 }}
      >
        <Card
          className={cn(
            'p-3 cursor-pointer transition-all duration-200 border-l-4',
            levelColors[level % levelColors.length],
            isSelected 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:bg-muted/50 hover:shadow-md'
          )}
          onClick={() => onSelect(node)}
        >
          <div className="flex items-center gap-3">
            {hasSubordinados && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {!hasSubordinados && <div className="w-6" />}

            <Avatar className="h-10 w-10 border-2 border-background shadow">
              <AvatarImage src={node.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{node.nome}</p>
              <p className="text-xs text-muted-foreground truncate">
                {node.cargo || 'Cargo não definido'}
              </p>
            </div>

            {hasSubordinados && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Users className="h-3 w-3 mr-1" />
                {node.subordinados!.length}
              </Badge>
            )}
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {hasSubordinados && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 mt-2 space-y-2 border-l-2 border-muted pl-4"
          >
            {node.subordinados!.map((sub) => (
              <OrgNode
                key={sub.id}
                node={sub}
                level={level + 1}
                onSelect={onSelect}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ColaboradorDetailProps {
  colaborador: ColaboradorOrganograma;
  gestor?: ColaboradorOrganograma;
  subordinados: ColaboradorOrganograma[];
  onNavigate: (c: ColaboradorOrganograma) => void;
  onClose: () => void;
}

const ColaboradorDetail = ({ colaborador, gestor, subordinados, onNavigate, onClose }: ColaboradorDetailProps) => {
  const initials = colaborador.nome
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary shadow-lg">
              <AvatarImage src={colaborador.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{colaborador.nome}</h3>
              <p className="text-muted-foreground">{colaborador.cargo || 'Cargo não definido'}</p>
              {colaborador.departamento && (
                <Badge variant="outline" className="mt-1">
                  <Building2 className="h-3 w-3 mr-1" />
                  {colaborador.departamento}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {gestor && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Reporta a
            </h4>
            <Card
              className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onNavigate(gestor)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={gestor.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {gestor.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{gestor.nome}</p>
                  <p className="text-xs text-muted-foreground">{gestor.cargo}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {subordinados.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipe ({subordinados.length})
            </h4>
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {subordinados.map((sub) => (
                  <Card
                    key={sub.id}
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onNavigate(sub)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sub.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {sub.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sub.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{sub.cargo}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default function Organograma() {
  const { arvore, colaboradores, isLoading, refetch, getSubordinados, getGestor, searchColaboradores } = useOrganograma();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColaborador, setSelectedColaborador] = useState<ColaboradorOrganograma | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const searchResults = useMemo(() => {
    return searchColaboradores(searchTerm);
  }, [searchTerm, searchColaboradores]);

  const handleToggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (node: ColaboradorOrganograma) => {
    setSelectedColaborador(node);
    // Expandir o caminho até o nó selecionado
    const expandPath = (nodes: ColaboradorOrganograma[], targetId: string): boolean => {
      for (const n of nodes) {
        if (n.id === targetId) return true;
        if (n.subordinados && expandPath(n.subordinados, targetId)) {
          setExpandedIds(prev => new Set(prev).add(n.id));
          return true;
        }
      }
      return false;
    };
    expandPath(arvore, node.id);
  };

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: ColaboradorOrganograma[]) => {
      nodes.forEach(n => {
        if (n.subordinados && n.subordinados.length > 0) {
          allIds.add(n.id);
          collectIds(n.subordinados);
        }
      });
    };
    collectIds(arvore);
    setExpandedIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const gestor = selectedColaborador ? getGestor(selectedColaborador.gestor_id) : undefined;
  const subordinados = selectedColaborador ? getSubordinados(selectedColaborador.id) : [];

  if (isLoading) {
    return (
      <PageLayout title="Organograma">
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Organograma" onRefresh={refetch}>
      <div className="space-y-4">
        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-primary/5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{colaboradores.length}</p>
                <p className="text-xs text-muted-foreground">Colaboradores</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 bg-hr/5">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-hr" />
              <div>
                <p className="text-xl font-bold">
                  {new Set(colaboradores.map(c => c.departamento).filter(Boolean)).size}
                </p>
                <p className="text-xs text-muted-foreground">Departamentos</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchTerm && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-2 space-y-1 bg-muted/30">
                <p className="text-xs text-muted-foreground px-2">
                  {searchResults.length} resultado(s)
                </p>
                {searchResults.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="p-2 rounded-lg hover:bg-background cursor-pointer flex items-center gap-3"
                    onClick={() => {
                      handleSelect(c);
                      setSearchTerm('');
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {c.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.cargo} • {c.departamento}
                      </p>
                    </div>
                  </div>
                ))}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            <ZoomIn className="h-4 w-4 mr-1" />
            Expandir
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            <ZoomOut className="h-4 w-4 mr-1" />
            Recolher
          </Button>
        </div>

        {/* Selected Detail */}
        <AnimatePresence>
          {selectedColaborador && (
            <ColaboradorDetail
              colaborador={selectedColaborador}
              gestor={gestor}
              subordinados={subordinados}
              onNavigate={handleSelect}
              onClose={() => setSelectedColaborador(null)}
            />
          )}
        </AnimatePresence>

        {/* Tree View */}
        <div className="space-y-2">
          {arvore.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Nenhuma hierarquia definida</h3>
              <p className="text-sm text-muted-foreground">
                Configure os gestores nos perfis dos colaboradores para visualizar o organograma.
              </p>
            </Card>
          ) : (
            arvore.map((node) => (
              <OrgNode
                key={node.id}
                node={node}
                level={0}
                onSelect={handleSelect}
                selectedId={selectedColaborador?.id}
                expandedIds={expandedIds}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}
