// src/styles/globals.ts
// This will have shared styling values that complement Chakra UI
import { mode } from '@chakra-ui/theme-tools';

export const globalStyles = {
  // Global style overrides
  global: props => ({
    // Base application styles
    body: {
      bg: mode('gray.50', 'gray.900')(props),
      minHeight: '100vh',
    },
    // Consistent focus styles
    '*:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.500',
      outlineOffset: '2px',
    },
    // Some general utility classes not provided by Chakra
    '.clickable': {
      cursor: 'pointer',
      _hover: {
        opacity: 0.8,
      },
    },
    // Specific styling for position colors (as a fallback)
    '.position-P': { bg: 'position.P', color: 'white' },
    '.position-C': { bg: 'position.C', color: 'white' },
    '.position-1B': { bg: 'position.1B', color: 'white' },
    '.position-2B': { bg: 'position.2B', color: 'white' },
    '.position-3B': { bg: 'position.3B', color: 'white' },
    '.position-SS': { bg: 'position.SS', color: 'white' },
    '.position-LF': { bg: 'position.LF', color: 'white' },
    '.position-CF': { bg: 'position.CF', color: 'white' },
    '.position-RF': { bg: 'position.RF', color: 'white' },
    '.position-DH': { bg: 'position.DH', color: 'white' },
    '.position-BN': { bg: 'position.BN', color: 'white' },
  }),
};