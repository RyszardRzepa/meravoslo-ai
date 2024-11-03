'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sheet } from '@/components/ui/sheet';

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider delayDuration={0}>
        <Sheet>
          {children}
        </Sheet>
      </TooltipProvider>
    </NextThemesProvider>
  );
}
