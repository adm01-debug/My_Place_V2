import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeMap: Record<string, string> = {
  'ponto': 'Ponto',
  'ferias': 'Férias',
  'holerites': 'Holerites',
  'solicitacoes': 'Solicitações',
  'perfil': 'Perfil',
  'admin': 'Admin',
  'locais': 'Locais Permitidos',
  'aprovacoes': 'Aprovações',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-xs text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap pb-1">
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="w-3 h-3" />
      </Link>
      
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = routeMap[value] || value;

        return (
          <div key={to} className="flex items-center space-x-1">
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            {last ? (
              <span className="font-medium text-foreground truncate max-w-[150px]">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
