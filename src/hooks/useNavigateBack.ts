import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook for intelligent back navigation.
 * Uses browser history when available, falls back to "/" (home).
 */
export function useNavigateBack(fallback = '/') {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = useRef(false);

  useEffect(() => {
    // Track that user has navigated within the app
    if (location.key !== 'default') {
      hasHistory.current = true;
    }
  }, [location]);

  const goBack = useCallback(() => {
    if (hasHistory.current && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }, [navigate, fallback]);

  return goBack;
}
