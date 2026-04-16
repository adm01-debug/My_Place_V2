import { useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const routeOrder = [
  '/',
  '/ponto',
  '/ferias',
  '/holerites',
  '/solicitacoes',
  '/perfil',
  '/admin/aprovacoes',
  '/admin/locais',
];

function getRouteIndex(path: string): number {
  const idx = routeOrder.indexOf(path);
  return idx >= 0 ? idx : routeOrder.length;
}

export type NavigationDirection = 'forward' | 'backward' | 'neutral';

export function useNavigationDirection(): NavigationDirection {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  const prevIndex = getRouteIndex(prevPath.current);
  const currIndex = getRouteIndex(location.pathname);

  let direction: NavigationDirection = 'neutral';
  if (prevPath.current !== location.pathname) {
    direction = currIndex > prevIndex ? 'forward' : currIndex < prevIndex ? 'backward' : 'neutral';
  }

  // Update ref after calculating direction
  if (prevPath.current !== location.pathname) {
    prevPath.current = location.pathname;
  }

  return direction;
}
