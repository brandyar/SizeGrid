import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isDesktopEnv } from '../utils/desktop';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType>({
  path: window.location.pathname,
  navigate: () => {},
  params: {}
});

export function useRouter() {
  return useContext(RouterContext);
}

// Custom parser to map parameters for patterns like '/shop/:shop_slug/product/:product_id'
function matchRoute(routePattern: string, currentPath: string): { matches: boolean; params: Record<string, string> } {
  const patternParts = routePattern.split('/').filter(Boolean);
  const pathParts = currentPath.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

interface RouterProviderProps {
  children: ReactNode;
}

export function RouterProvider({ children }: RouterProviderProps) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState(null, '', to);
    setPath(to);
    // Scroll smoothly back to top on transitions
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extract dynamic parameters
  let activeParams: Record<string, string> = {};
  
  // Define known dynamic patterns to extract variables
  const shopPattern = "/shop/:shop_slug/product/:product_id";
  const { matches, params } = matchRoute(shopPattern, path);
  if (matches) {
    activeParams = params;
  }

  // Intercept normal anchor clicks if they are internal
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        const targetAttr = anchor.getAttribute('target');
        
        // Intercept internal relative links
        if (href && href.startsWith('/')) {
          // On desktop, or if not target="_blank", navigate internally
          if (isDesktopEnv() || !targetAttr) {
            e.preventDefault();
            navigate(href);
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate, params: activeParams }}>
      {children}
    </RouterContext.Provider>
  );
}

interface RouteProps {
  pattern: string;
  element: React.ReactElement;
}

export function Route({ pattern, element }: RouteProps) {
  const { path } = useRouter();

  // Handle perfect match or wildcards
  if (pattern === path) {
    return element;
  }

  // Dynamic parameters matching
  if (pattern.includes(':')) {
    const { matches } = matchRoute(pattern, path);
    if (matches) {
      return element;
    }
  }

  // Fallback for sub-routes like /dashboard/*
  if (pattern.endsWith('/*')) {
    const basePattern = pattern.slice(0, -2);
    if (path.startsWith(basePattern)) {
      return element;
    }
  }

  return null;
}
