import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// =====================================================
// TYPES
// =====================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  /** Gerar automaticamente baseado na rota */
  auto?: boolean;
  /** Mapa de labels para rotas */
  routeLabels?: Record<string, string>;
  /** Mostrar ícone de home no início */
  showHome?: boolean;
  /** Máximo de itens visíveis (resto fica em dropdown) */
  maxItems?: number;
  /** Separador customizado */
  separator?: React.ReactNode;
  /** Classe CSS */
  className?: string;
}

// =====================================================
// ROUTE LABELS DEFAULT
// =====================================================

const DEFAULT_ROUTE_LABELS: Record<string, string> = {
  '': 'Início',
  'dashboard': 'Dashboard',
  'ponto': 'Ponto',
  'ferias': 'Férias',
  'holerites': 'Holerites',
  'beneficios': 'Benefícios',
  'treinamentos': 'Treinamentos',
  'documentos': 'Documentos',
  'comunicados': 'Comunicados',
  'solicitacoes': 'Solicitações',
  'emprestimos': 'Empréstimos',
  'metas': 'Metas',
  'perfil': 'Meu Perfil',
  'admin': 'Administração',
  'gestao': 'Gestão',
  'faq': 'FAQ',
  'organograma': 'Organograma',
  'calendario': 'Calendário',
  'feedback360': 'Feedback 360°',
  'pesquisas-clima': 'Pesquisas de Clima',
  'variavel': 'Remuneração Variável',
  'calculadora': 'Calculadora',
  'menu': 'Menu',
  'configuracoes': 'Configurações',
  'notificacoes': 'Notificações',
};

// =====================================================
// HOOK: useBreadcrumbs
// =====================================================

export function useBreadcrumbs(
  routeLabels: Record<string, string> = DEFAULT_ROUTE_LABELS
): BreadcrumbItem[] {
  const location = useLocation();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    const items: BreadcrumbItem[] = pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = routeLabels[segment] || 
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      return {
        label,
        href: index === pathSegments.length - 1 ? undefined : href,
        current: index === pathSegments.length - 1,
      };
    });

    return items;
  }, [location.pathname, routeLabels]);
}

// =====================================================
// COMPONENT: BreadcrumbLink
// =====================================================

interface BreadcrumbLinkProps {
  item: BreadcrumbItem;
}

const BreadcrumbLink: React.FC<BreadcrumbLinkProps> = ({ item }) => {
  const baseClasses = "flex items-center gap-1.5 text-sm transition-colors";
  
  if (item.current) {
    return (
      <span
        className={`${baseClasses} font-medium text-foreground`}
        aria-current="page"
      >
        {item.icon}
        {item.label}
      </span>
    );
  }

  if (item.href) {
    return (
      <Link
        to={item.href}
        className={`${baseClasses} text-muted-foreground hover:text-foreground`}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  }

  return (
    <span className={`${baseClasses} text-muted-foreground`}>
      {item.icon}
      {item.label}
    </span>
  );
};

// =====================================================
// COMPONENT: Breadcrumbs
// =====================================================

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items: propItems,
  auto = true,
  routeLabels = DEFAULT_ROUTE_LABELS,
  showHome = true,
  maxItems = 4,
  separator = <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />,
  className = '',
}) => {
  const autoItems = useBreadcrumbs(routeLabels);
  const items = propItems || (auto ? autoItems : []);

  // Add home if needed
  const allItems: BreadcrumbItem[] = useMemo(() => {
    if (!showHome || items.length === 0) return items;
    
    const homeItem: BreadcrumbItem = {
      label: 'Início',
      href: '/',
      icon: <Home className="w-4 h-4" />,
    };

    // Check if first item is already home
    if (items[0]?.href === '/' || items[0]?.label === 'Início') {
      return items;
    }

    return [homeItem, ...items];
  }, [items, showHome]);

  if (allItems.length === 0) {
    return null;
  }

  // Determine which items to show and which to collapse
  const shouldCollapse = allItems.length > maxItems;
  
  let visibleItems: BreadcrumbItem[] = allItems;
  let collapsedItems: BreadcrumbItem[] = [];

  if (shouldCollapse) {
    // Keep first, last, and possibly second-to-last
    const firstItem = allItems[0];
    const lastItem = allItems[allItems.length - 1];
    
    collapsedItems = allItems.slice(1, -1);
    visibleItems = [firstItem];
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 ${className}`}
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {shouldCollapse ? (
          <>
            {/* First item */}
            <li className="flex items-center gap-2">
              <BreadcrumbLink item={visibleItems[0]} />
              {separator}
            </li>

            {/* Collapsed items in dropdown */}
            <li className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Mostrar mais navegação"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {collapsedItems.map((item, index) => (
                    <DropdownMenuItem key={index} asChild>
                      {item.href ? (
                        <Link to={item.href} className="flex items-center gap-2">
                          {item.icon}
                          {item.label}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2">
                          {item.icon}
                          {item.label}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {separator}
            </li>

            {/* Last item (current) */}
            <li>
              <BreadcrumbLink item={allItems[allItems.length - 1]} />
            </li>
          </>
        ) : (
          allItems.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <BreadcrumbLink item={item} />
              {index < allItems.length - 1 && separator}
            </li>
          ))
        )}
      </ol>
    </nav>
  );
};

// =====================================================
// COMPONENT: PageHeader with Breadcrumbs
// =====================================================

interface PageHeaderProps {
  title: string;
  description?: string;
  showBreadcrumbs?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
  actions?: React.ReactNode;
  backLink?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  showBreadcrumbs = true,
  breadcrumbItems,
  actions,
  backLink,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {showBreadcrumbs && (
        <Breadcrumbs items={breadcrumbItems} />
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Breadcrumbs;
