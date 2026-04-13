import { useState, useMemo } from 'react';
import { Search, ZoomIn, ZoomOut, Users, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLayout } from '@/components/portal/PageLayout';
import { useOrganograma, ColaboradorOrganograma } from '@/hooks/useOrganograma';
import { motion, AnimatePresence } from 'framer-motion';
import { OrgNode } from '@/components/organograma/OrgNode';
import { ColaboradorDetail } from '@/components/organograma/ColaboradorDetail';

export default function Organograma() {
  const { arvore, colaboradores, isLoading, refetch, getSubordinados, getGestor, searchColaboradores } = useOrganograma();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColaborador, setSelectedColaborador] = useState<ColaboradorOrganograma | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const searchResults = useMemo(() => searchColaboradores(searchTerm), [searchTerm, searchColaboradores]);

  const handleToggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelect = (node: ColaboradorOrganograma) => {
    setSelectedColaborador(node);
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
    const collect = (nodes: ColaboradorOrganograma[]) => {
      nodes.forEach(n => { if (n.subordinados?.length) { allIds.add(n.id); collect(n.subordinados); } });
    };
    collect(arvore);
    setExpandedIds(allIds);
  };

  const gestor = selectedColaborador ? getGestor(selectedColaborador.gestor_id) : undefined;
  const subordinados = selectedColaborador ? getSubordinados(selectedColaborador.id) : [];

  if (isLoading) {
    return (
      <PageLayout title="Organograma">
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Organograma" onRefresh={refetch}>
      <div className="space-y-4">
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
                <p className="text-xl font-bold">{new Set(colaboradores.map(c => c.departamento).filter(Boolean)).size}</p>
                <p className="text-xs text-muted-foreground">Departamentos</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar colaborador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        <AnimatePresence>
          {searchTerm && searchResults.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="p-2 space-y-1 bg-muted/30">
                <p className="text-xs text-muted-foreground px-2">{searchResults.length} resultado(s)</p>
                {searchResults.slice(0, 5).map((c) => (
                  <div key={c.id} className="p-2 rounded-lg hover:bg-background cursor-pointer flex items-center gap-3"
                    onClick={() => { handleSelect(c); setSearchTerm(''); }}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {c.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.cargo} • {c.departamento}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}><ZoomIn className="h-4 w-4 mr-1" />Expandir</Button>
          <Button variant="outline" size="sm" onClick={() => setExpandedIds(new Set())}><ZoomOut className="h-4 w-4 mr-1" />Recolher</Button>
        </div>

        <AnimatePresence>
          {selectedColaborador && (
            <ColaboradorDetail colaborador={selectedColaborador} gestor={gestor} subordinados={subordinados}
              onNavigate={handleSelect} onClose={() => setSelectedColaborador(null)} />
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {arvore.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Nenhuma hierarquia definida</h3>
              <p className="text-sm text-muted-foreground">Configure os gestores nos perfis dos colaboradores para visualizar o organograma.</p>
            </Card>
          ) : arvore.map((node) => (
            <OrgNode key={node.id} node={node} level={0} onSelect={handleSelect}
              selectedId={selectedColaborador?.id} expandedIds={expandedIds} onToggle={handleToggle} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
