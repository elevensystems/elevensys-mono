'use client';

import { useEffect, useRef } from 'react';

import { useIsTablet } from '../hooks/use-is-tablet';
import { useSidebar } from './sidebar';

export function SidebarAutoCollapse() {
  const isTablet = useIsTablet();
  const { setOpen } = useSidebar();
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  useEffect(() => {
    setOpenRef.current(!isTablet);
  }, [isTablet]);

  return null;
}
