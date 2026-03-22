import { useEffect, useCallback, useState } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook to warn users before leaving a page with unsaved changes.
 * Shows a confirmation dialog when navigating away.
 */
export function useUnsavedChanges(hasChanges: boolean) {
  // Block navigation within the app
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Block browser close/refresh
  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const confirm = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const cancel = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return {
    isBlocked: blocker.state === 'blocked',
    confirm,
    cancel,
  };
}
