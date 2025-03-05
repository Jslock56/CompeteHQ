// src/theme.ts
import { extendTheme, ThemeConfig } from '@chakra-ui/react';

// Position type for TypeScript
type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'BN';

// Define the color palette
const colors = {
  primary: {
    50: '#f0f7ff',
    100: '#e0f0fe',
    200: '#bae0fd',
    300: '#90cafc',
    400: '#60b2f7',
    500: '#4682B4',  // Steel Blue
    600: '#3b74a9',
    700: '#2d5d8b',
    800: '#264e73',
    900: '#193545',
    950: '#0f2231',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  position: {
    P: '#ef4444',
    C: '#3b82f6',
    '1B': '#10b981',
    '2B': '#f59e0b',
    '3B': '#8b5cf6',
    SS: '#ec4899',
    LF: '#6366f1',
    CF: '#6366f1',
    RF: '#6366f1',
    DH: '#0ea5e9',
    BN: '#6b7280',
  }
};

// Chakra UI config
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'md',
    },
    variants: {
      primary: {
        bg: 'primary.500',
        color: 'white',
        _hover: { bg: 'primary.600' },
        _active: { bg: 'primary.700' },
      },
      secondary: {
        bg: 'secondary.500',
        color: 'white',
        _hover: { bg: 'secondary.600' },
        _active: { bg: 'secondary.700' },
      },
      outline: (props) => ({
        borderColor: `${props.colorScheme || 'primary'}.500`,
        color: `${props.colorScheme || 'primary'}.500`,
        _hover: {
          bg: `${props.colorScheme || 'primary'}.50`,
        },
      }),
      ghost: (props) => ({
        color: `${props.colorScheme || 'gray'}.600`,
        _hover: {
          bg: `${props.colorScheme || 'gray'}.100`,
        },
      }),
    },
    defaultProps: {
      variant: 'primary',
      colorScheme: 'primary',
    },
  },
  Card: {
    baseStyle: {
      container: {
        background: 'white',
        borderRadius: 'lg',
        boxShadow: 'md',
        overflow: 'hidden',
      },
      header: {
        padding: 4,
        borderBottom: '1px solid',
        borderColor: 'gray.200',
      },
      body: {
        padding: 4,
      },
      footer: {
        padding: 4,
        borderTop: '1px solid',
        borderColor: 'gray.200',
        background: 'gray.50',
      },
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'semibold',
      color: 'gray.800',
    },
  },
};

// Full theme
export const theme = extendTheme({
  colors,
  config,
  components,
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  fonts: {
    heading: `'Geist', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    body: `'Geist', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  },
});

// Position color utility functions
export const getPositionColor = (position: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
  // Position color mapping using the defined colors
  const colorMap = {
    P: 'red',
    C: 'blue',
    '1B': 'green',
    '2B': 'orange',
    '3B': 'purple',
    SS: 'pink',
    LF: 'indigo',
    CF: 'indigo',
    RF: 'indigo',
    DH: 'cyan',
    BN: 'gray',
  };
  
  // Get the color scheme or default to gray
  const colorScheme = colorMap[position] || 'gray';
  
  // Return the appropriate shade based on the variant
  if (variant === 'bg') return `${colorScheme}.500`;
  if (variant === 'text') return `${colorScheme}.700`;
  if (variant === 'border') return `${colorScheme}.300`;
  
  return `${colorScheme}.500`;
};

export default theme;