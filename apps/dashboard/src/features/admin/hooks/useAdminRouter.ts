import { useState, useEffect } from 'react';
import { AdminRoute, ADMIN_ROUTES } from '../constants/routes';

export function useAdminRouter() {
  const [currentRoute, setCurrentRoute] = useState<AdminRoute>(() => {
    // Basic hash routing for deep-linking/refresh support without full react-router
    const hash = window.location.hash.replace('#', '') as AdminRoute;
    return Object.values(ADMIN_ROUTES).includes(hash) ? hash : ADMIN_ROUTES.OVERVIEW;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as AdminRoute;
      if (Object.values(ADMIN_ROUTES).includes(hash)) {
        setCurrentRoute(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: AdminRoute) => {
    window.location.hash = route;
    setCurrentRoute(route);
  };

  return { currentRoute, navigate };
}
