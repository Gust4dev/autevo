'use client';

import { useEffect, createContext, useContext } from 'react';
import { trpc } from '@/lib/trpc/provider';

interface TenantTheme {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  name: string;
}

const TenantThemeContext = createContext<TenantTheme | null>(null);

export function useTenantTheme() {
  return useContext(TenantThemeContext);
}

// Convert hex to HSL for CSS variable (Tailwind uses HSL format)
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Return HSL string in format expected by Tailwind CSS variables
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface TenantThemeProviderProps {
  children: React.ReactNode;
}

export function TenantThemeProvider({ children }: TenantThemeProviderProps) {
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (settings?.primaryColor) {
      const hsl = hexToHSL(settings.primaryColor);
      document.documentElement.style.setProperty('--primary', hsl);
      // Also set ring color to match
      document.documentElement.style.setProperty('--ring', hsl);
    }

    if (settings?.secondaryColor) {
      const hsl = hexToHSL(settings.secondaryColor);
      document.documentElement.style.setProperty('--secondary', hsl);
    }

    // Cleanup on unmount or when settings change
    return () => {
      // Optionally reset to default colors
    };
  }, [settings?.primaryColor, settings?.secondaryColor]);

  const theme: TenantTheme = {
    logo: settings?.logo || null,
    primaryColor: settings?.primaryColor || '#DC2626',
    secondaryColor: settings?.secondaryColor || '#1F2937',
    name: settings?.name || 'Filmtech OS',
  };

  return (
    <TenantThemeContext.Provider value={theme}>
      {children}
    </TenantThemeContext.Provider>
  );
}
