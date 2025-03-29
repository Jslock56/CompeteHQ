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
  const [isVisible, setIsVisible] = useState(false);

  // Reset visibility state when path changes
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, [pathname]);

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