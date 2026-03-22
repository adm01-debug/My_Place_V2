import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Route depth map — deeper pages get higher numbers
const routeDepth: Record<string, number> = {
  '/login': 0,
  '/': 1,
  '/menu': 1,
  '/perfil': 2,
  '/holerites': 2,
  '/ponto': 2,
  '/ferias': 2,
  '/variavel': 2,
  '/emprestimos': 2,
  '/beneficios': 2,
  '/treinamentos': 2,
  '/documentos': 2,
  '/solicitacoes': 2,
  '/comunicados': 2,
  '/calculadora': 2,
  '/faq': 2,
  '/organograma': 2,
  '/calendario': 2,
  '/metas': 2,
  '/feedback': 2,
  '/clima': 2,
  '/kudos': 2,
  '/trilhas': 2,
  '/admin': 3,
  '/gestao': 3,
};

function getDepth(pathname: string): number {
  return routeDepth[pathname] ?? 2;
}

/**
 * Returns 1 for forward navigation (deeper), -1 for back navigation (shallower).
 */
export function useNavigationDirection(): number {
  const location = useLocation();
  const prevPathname = useRef(location.pathname);
  const direction = useRef(1);

  useEffect(() => {
    const prevDepth = getDepth(prevPathname.current);
    const currDepth = getDepth(location.pathname);

    direction.current = currDepth >= prevDepth ? 1 : -1;
    prevPathname.current = location.pathname;
  }, [location.pathname]);

  return direction.current;
}
