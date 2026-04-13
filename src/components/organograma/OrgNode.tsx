import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { ColaboradorOrganograma } from '@/hooks/useOrganograma';

interface OrgNodeProps {
  node: ColaboradorOrganograma;
  level: number;
  onSelect: (node: ColaboradorOrganograma) => void;
  selectedId?: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

const levelColors = [
  'border-l-primary',
  'border-l-hr',
  'border-l-finance',
  'border-l-projects',
  'border-l-marketing',
];

export function OrgNode({ node, level, onSelect, selectedId, expandedIds, onToggle }: OrgNodeProps) {
  const hasSubordinados = node.subordinados && node.subordinados.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const initials = node.nome
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

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
            {hasSubordinados ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : <div className="w-6" />}

            <Avatar className="h-10 w-10 border-2 border-background shadow">
              <AvatarImage src={node.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{node.nome}</p>
              <p className="text-xs text-muted-foreground truncate">{node.cargo || 'Cargo não definido'}</p>
            </div>

            {hasSubordinados && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Users className="h-3 w-3 mr-1" />{node.subordinados!.length}
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
}
