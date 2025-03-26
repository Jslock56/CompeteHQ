'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { TeamProvider } from "../contexts/team-context";
import { AuthProvider } from "../contexts/auth-context";

// Your theme configuration
const theme = extendTheme({
  colors: {
    primary: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9dff',
      500: '#0087e6',
      600: '#0068b3',
      700: '#004a80',
      800: '#002b4d',
      900: '#000d1a',
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme} resetCSS>
        <AuthProvider>
          <TeamProvider>
            {children}
          </TeamProvider>
        </AuthProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}