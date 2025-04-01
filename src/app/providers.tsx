'use client';

// Revert to original imports to fix build errors
import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { TeamProvider } from "../contexts/team-context";
import { AuthProvider } from "../contexts/auth-context";
import { StorageProvider } from "../contexts/storage-context";
import { theme } from "../theme"; // Use the theme from theme.ts

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme} resetCSS toastOptions={{ defaultOptions: { position: 'top' } }}>
        <div id="chakra-root" suppressHydrationWarning>
          <StorageProvider>
            <AuthProvider>
              <TeamProvider>
                {children}
              </TeamProvider>
            </AuthProvider>
          </StorageProvider>
        </div>
      </ChakraProvider>
    </CacheProvider>
  );
}