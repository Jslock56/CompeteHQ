// src/theme.ts
import { extendTheme, ThemeConfig } from '@chakra-ui/react';

// Position type for TypeScript
type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'BN';

// Define the color palette
const colors = {
  primary: {
    // Updated to match the providers.tsx theme
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
    // Keep extended shades for better gradient support
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
  // Keep position colors unchanged since they affect many components
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
    baseStyle: (props) => ({
      fontWeight: 'medium',
      borderRadius: 'md',
      color: props.colorMode === 'dark' ? 'white' : undefined,
    }),
    variants: {
      primary: (props) => ({
        bg: 'primary.500',
        color: 'white',
        _hover: { bg: 'primary.600' },
        _active: { bg: 'primary.700' },
      }),
      secondary: (props) => ({
        bg: 'secondary.500',
        color: 'white',
        _hover: { bg: 'secondary.600' },
        _active: { bg: 'secondary.700' },
      }),
      outline: (props) => ({
        borderColor: `${props.colorScheme || 'primary'}.500`,
        color: props.colorMode === 'dark' ? `${props.colorScheme || 'primary'}.300` : `${props.colorScheme || 'primary'}.500`,
        _hover: {
          bg: props.colorMode === 'dark' ? `${props.colorScheme || 'primary'}.800` : `${props.colorScheme || 'primary'}.50`,
        },
      }),
      ghost: (props) => ({
        color: props.colorMode === 'dark' ? `${props.colorScheme || 'gray'}.300` : `${props.colorScheme || 'gray'}.600`,
        _hover: {
          bg: props.colorMode === 'dark' ? `${props.colorScheme || 'gray'}.700` : `${props.colorScheme || 'gray'}.100`,
        },
      }),
    },
    defaultProps: {
      variant: 'primary',
      colorScheme: 'primary',
    },
  },
  Card: {
    baseStyle: (props) => ({
      container: {
        background: props.colorMode === 'dark' ? 'gray.700' : 'white',
        borderRadius: 'lg',
        boxShadow: 'md',
        overflow: 'hidden',
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
        borderWidth: '1px',
      },
      header: {
        padding: 4,
        borderBottom: '1px solid',
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
      },
      body: {
        padding: 4,
      },
      footer: {
        padding: 4,
        borderTop: '1px solid',
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
        background: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
      },
    }),
  },
  Heading: {
    baseStyle: (props) => ({
      fontWeight: 'semibold',
      color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
    }),
  },
  Table: {
    variants: {
      simple: (props) => ({
        th: {
          borderBottom: '1px solid',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          textTransform: 'uppercase',
          fontSize: 'xs',
          fontWeight: 'bold',
          letterSpacing: 'wider',
          color: props.colorMode === 'dark' ? 'gray.300' : 'gray.600',
          bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
        },
        td: {
          borderBottom: '1px solid',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        },
        tr: {
          _hover: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
          }
        },
        caption: {
          color: props.colorMode === 'dark' ? 'gray.300' : 'gray.600',
        }
      }),
    },
    defaultProps: {
      variant: 'simple',
    },
  },
  Input: {
    variants: {
      outline: (props) => ({
        field: {
          bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          _hover: {
            borderColor: props.colorMode === 'dark' ? 'gray.500' : 'gray.300',
          },
          _focus: {
            borderColor: 'primary.500',
            boxShadow: `0 0 0 1px var(--chakra-colors-primary-500)`,
          },
        },
      }),
    },
  },
  Select: {
    variants: {
      outline: (props) => ({
        field: {
          bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          _hover: {
            borderColor: props.colorMode === 'dark' ? 'gray.500' : 'gray.300',
          },
          _focus: {
            borderColor: 'primary.500',
            boxShadow: `0 0 0 1px var(--chakra-colors-primary-500)`,
          },
        },
      }),
    },
  },
};

// Full theme
export const theme = extendTheme({
  colors,
  config,
  components,
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
      },
      // Ensure backgrounds of components are consistent
      '.chakra-card': {
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
      },
      '.chakra-modal__content': {
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
      },
      // Fix any table background issues
      'table.chakra-table thead tr th': {
        bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
      },
      // Make sure inputs and selects have proper colors
      '.chakra-input, .chakra-select': {
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
      },
    }),
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