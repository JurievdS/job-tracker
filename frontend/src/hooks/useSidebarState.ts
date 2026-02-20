import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';
const MOBILE_BREAKPOINT = 1024; // lg

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeMobile = useCallback(() => setIsMobileOpen(false), []);
  const toggleCollapsed = useCallback(() => setIsCollapsed(prev => !prev), []);
  const toggleMobile = useCallback(() => setIsMobileOpen(prev => !prev), []);

  return {
    isCollapsed,
    isMobileOpen,
    isMobile,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
  };
}
