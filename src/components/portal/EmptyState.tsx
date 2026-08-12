import React from 'react';
import {
  FileX,
  Search,
  Calendar,
  Users,
  FileText,
  Clock,
  Bell,
  MessageSquare,
  Target,
  Award,
  Folder,
  CreditCard,
  TrendingUp,
  BookOpen,
  Gift,
  ClipboardList,
  Building2,
  Inbox,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS
// ============================================================================

export type EmptyStateType =
  | 'generic'
  | 'search'
  | 'filter'
  | 'ferias'
  | 'ponto'
  | 'holerites'
  | 'beneficios'
  | 'treinamentos'
  | 'documentos'
  | 'comunicados'
  | 'emprestimos'
  | 'metas'
  | 'feedback'
  | 'pesquisas'
  | 'solicitacoes'
  | 'notificacoes'
  | 'calendario'
  | 'organograma'
  | 'usuarios'
  | 'error'
  | 'success'
  | 'loading';

export type EmptyStateVariant = 'default' | 'card' | 'minimal' | 'compact';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  type?: EmptyStateType;
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

// ============================================================================
// CONFIGURAÇÕES POR TIPO
// ============================================================================

interface TypeConfig {
  icon: LucideIcon;
  title: string;
  description: string;
}

const TYPE_CONFIGS: Record<EmptyStateType, TypeConfig> = {
  generic: {
    icon: Inbox,
    title: 'Nenhum item encontrado',
    description: 'Não há itens para exibir no momento.',
  },
  search: {
    icon: Search,
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar os termos da sua busca ou remover filtros.',
  },
  filter: {
    icon: Filter,
    title: 'Nenhum resultado com esses filtros',
    description: 'Tente remover alguns filtros para ver mais resultados.',
  },
  ferias: {
    icon: Calendar,
    title: 'Nenhuma solicitação de férias',
    description: 'Você ainda não possui solicitações de férias registradas.',
  },
  ponto: {
    icon: Clock,
    title: 'Nenhum registro de ponto',
    description: 'Não há registros de ponto para o período selecionado.',
  },
  holerites: {
    icon: FileText,
    title: 'Nenhum holerite disponível',
    description: 'Seus holerites aparecerão aqui quando estiverem disponíveis.',
  },
  beneficios: {
    icon: Gift,
    title: 'Nenhum benefício cadastrado',
    description: 'Seus benefícios aparecerão aqui quando forem configurados.',
  },
  treinamentos: {
    icon: BookOpen,
    title: 'Nenhum treinamento disponível',
    description: 'Novos treinamentos serão exibidos aqui quando disponíveis.',
  },
  documentos: {
    icon: Folder,
    title: 'Nenhum documento disponível',
    description: 'Documentos compartilhados com você aparecerão aqui.',
  },
  comunicados: {
    icon: MessageSquare,
    title: 'Nenhum comunicado',
    description: 'Você está em dia! Não há comunicados no momento.',
  },
  emprestimos: {
    icon: CreditCard,
    title: 'Nenhum empréstimo',
    description: 'Você não possui empréstimos ativos ou histórico de empréstimos.',
  },
  metas: {
    icon: Target,
    title: 'Nenhuma meta definida',
    description: 'Suas metas aparecerão aqui quando forem configuradas.',
  },
  feedback: {
    icon: Award,
    title: 'Nenhum feedback disponível',
    description: 'Feedbacks recebidos e enviados aparecerão aqui.',
  },
  pesquisas: {
    icon: ClipboardList,
    title: 'Nenhuma pesquisa disponível',
    description: 'Pesquisas de clima e outras avaliações aparecerão aqui.',
  },
  solicitacoes: {
    icon: ClipboardList,
    title: 'Nenhuma solicitação',
    description: 'Você não possui solicitações pendentes ou em andamento.',
  },
  notificacoes: {
    icon: Bell,
    title: 'Nenhuma notificação',
    description: 'Você está em dia! Não há notificações no momento.',
  },
  calendario: {
    icon: Calendar,
    title: 'Nenhum evento',
    description: 'Não há eventos agendados para este período.',
  },
  organograma: {
    icon: Building2,
    title: 'Organograma não disponível',
    description: 'A estrutura organizacional ainda não foi configurada.',
  },
  usuarios: {
    icon: Users,
    title: 'Nenhum usuário encontrado',
    description: 'Não foram encontrados usuários com os critérios informados.',
  },
  error: {
    icon: XCircle,
    title: 'Erro ao carregar dados',
    description: 'Ocorreu um erro ao carregar as informações. Tente novamente.',
  },
  success: {
    icon: CheckCircle2,
    title: 'Tudo certo!',
    description: 'A operação foi concluída com sucesso.',
  },
  loading: {
    icon: Clock,
    title: 'Carregando...',
    description: 'Aguarde enquanto os dados são carregados.',
  },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  variant = 'default',
  icon: CustomIcon,
  title,
  description,
  action,
  secondaryAction,
  className,
  iconClassName,
  children,
}) => {
  const config = TYPE_CONFIGS[type];
  const Icon = CustomIcon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  // Estilos por variante
  const containerStyles = {
    default: 'py-12 px-4',
    card: 'py-8 px-6 rounded-lg border bg-card',
    minimal: 'py-6',
    compact: 'py-4',
  };

  const iconSizes = {
    default: 'h-12 w-12',
    card: 'h-10 w-10',
    minimal: 'h-8 w-8',
    compact: 'h-6 w-6',
  };

  const titleSizes = {
    default: 'text-lg font-semibold',
    card: 'text-base font-semibold',
    minimal: 'text-base font-medium',
    compact: 'text-sm font-medium',
  };

  const descriptionSizes = {
    default: 'text-sm',
    card: 'text-sm',
    minimal: 'text-sm',
    compact: 'text-xs',
  };

  // Cores especiais por tipo
  const iconColors: Partial<Record<EmptyStateType, string>> = {
    error: 'text-destructive',
    success: 'text-green-500',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        containerStyles[variant],
        className
      )}
    >
      {/* Ícone */}
      <div
        className={cn(
          'rounded-full bg-muted p-4 mb-4',
          variant === 'compact' && 'p-2 mb-2'
        )}
      >
        <Icon
          className={cn(
            iconSizes[variant],
            'text-muted-foreground',
            iconColors[type],
            iconClassName
          )}
        />
      </div>

      {/* Título */}
      <h3 className={cn(titleSizes[variant], 'text-foreground mb-1')}>
        {displayTitle}
      </h3>

      {/* Descrição */}
      <p
        className={cn(
          descriptionSizes[variant],
          'text-muted-foreground max-w-sm',
          variant === 'compact' && 'max-w-xs'
        )}
      >
        {displayDescription}
      </p>

      {/* Ações */}
      {(action || secondaryAction) && (
        <div className={cn('flex gap-3 mt-4', variant === 'compact' && 'mt-2')}>
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'outline'}
              size={variant === 'compact' ? 'sm' : 'default'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon && (
                <secondaryAction.icon className="h-4 w-4 mr-2" />
              )}
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button
              variant={action.variant || 'default'}
              size={variant === 'compact' ? 'sm' : 'default'}
              onClick={action.onClick}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          )}
        </div>
      )}

      {/* Conteúdo customizado */}
      {children}
    </div>
  );
};

// ============================================================================
// COMPONENTES ESPECIALIZADOS
// ============================================================================

interface EmptyListProps {
  type: EmptyStateType;
  searchTerm?: string;
  onClearSearch?: () => void;
  onAdd?: () => void;
  addLabel?: string;
}

export const EmptyList: React.FC<EmptyListProps> = ({
  type,
  searchTerm,
  onClearSearch,
  onAdd,
  addLabel,
}) => {
  if (searchTerm) {
    return (
      <EmptyState
        type="search"
        title={`Nenhum resultado para "${searchTerm}"`}
        action={onClearSearch ? { label: 'Limpar busca', onClick: onClearSearch, variant: 'outline' } : undefined}
      />
    );
  }

  return (
    <EmptyState
      type={type}
      action={onAdd ? { label: addLabel || 'Adicionar', onClick: onAdd } : undefined}
    />
  );
};

interface NoSearchResultsProps {
  searchTerm: string;
  onClear?: () => void;
  suggestions?: string[];
}

export const NoSearchResults: React.FC<NoSearchResultsProps> = ({
  searchTerm,
  onClear,
  suggestions,
}) => {
  return (
    <EmptyState
      type="search"
      title={`Nenhum resultado para "${searchTerm}"`}
      description={suggestions ? 'Tente uma destas sugestões:' : undefined}
      action={onClear ? { label: 'Limpar busca', onClick: onClear, variant: 'outline' } : undefined}
    >
      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground cursor-pointer hover:bg-muted/80"
            >
              {suggestion}
            </span>
          ))}
        </div>
      )}
    </EmptyState>
  );
};

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
}) => {
  return (
    <EmptyState
      type="error"
      description={message}
      action={onRetry ? { label: 'Tentar novamente', onClick: onRetry } : undefined}
    />
  );
};

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  return (
    <EmptyState
      type="loading"
      description={message}
      iconClassName="animate-spin"
    />
  );
};

export default EmptyState;
