'use client';

import React, { useState, useEffect } from 'react';
import { Box, Fade, ScaleFade, SlideFade, useColorModeValue } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';

interface PageTransitionsProps {
  children: React.ReactNode;
  type?: 'fade' | 'scale' | 'slide';
  duration?: number;
}

const PageTransitions: React.FC<PageTransitionsProps> = ({
  children,
  type = 'fade',
  duration = 0.3,
}) => {
  // Call all hooks at the top level in the same order
  const pathname = usePathname();
  const bgColor = useColorModeValue('white', 'gray.800');
  // Force the color mode to be the same during SSR and client rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [isVisible, setIsVisible] = useState(true); // Start visible for SSR

  // Reset visibility state when path changes - initialize as true for SSR
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient) return;
    
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, [pathname, isClient]);

  // Skip animations during SSR or initial client render
  if (!mounted) {
    return (
      <Box bg={bgColor}>
        {children}
      </Box>
    );
  }
  
  if (type === 'scale') {
    return (
      <ScaleFade 
        initialScale={0.9} 
        in={isVisible} 
        transition={{ enter: { duration } }}
      >
        <Box bg={bgColor}>
          {children}
        </Box>
      </ScaleFade>
    );
  }

  if (type === 'slide') {
    return (
      <SlideFade 
        offsetY="20px" 
        in={isVisible} 
        transition={{ enter: { duration } }}
      >
        <Box bg={bgColor}>
          {children}
        </Box>
      </SlideFade>
    );
  }

  // Default to fade
  return (
    <Fade 
      in={isVisible} 
      transition={{ enter: { duration } }}
    >
      <Box bg={bgColor}>
        {children}
      </Box>
    </Fade>
  );
};

export default PageTransitions;