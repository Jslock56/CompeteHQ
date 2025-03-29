'use client';

import React from 'react';
import { Box, Flex, Text, Image, useColorModeValue } from '@chakra-ui/react';
import NextLink from 'next/link';

interface LogoProps {
  /**
   * Show both the logo image and text
   */
  showText?: boolean;
  
  /**
   * Size of the logo (sm, md, lg)
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Custom width (overrides size)
   */
  width?: string | number;
  
  /**
   * Custom height (overrides size)
   */
  height?: string | number;
}

/**
 * Logo component that can be used throughout the application
 */
export default function Logo({ 
  showText = true, 
  size = 'md',
  width,
  height
}: LogoProps) {
  // Determine text color based on current theme
  const textColor = useColorModeValue('gray.800', 'white');
  
  // Calculate dimensions based on size
  const dimensions = {
    sm: { logoSize: '24px', fontSize: 'sm', spacing: '1' },
    md: { logoSize: '32px', fontSize: 'md', spacing: '2' },
    lg: { logoSize: '40px', fontSize: 'lg', spacing: '3' }
  };
  
  const { logoSize, fontSize, spacing } = dimensions[size];
  
  // Use custom dimensions if provided
  const logoWidth = width || logoSize;
  const logoHeight = height || logoSize;
  
  return (
    <NextLink href="/" passHref>
      <Flex align="center" cursor="pointer">
        {/* Logo Image */}
        <Box 
          w={logoWidth} 
          h={logoHeight} 
          position="relative"
          mr={showText ? spacing : 0}
        >
          {/* Use Image for actual logo */}
          <Image
            src={`/assets/images/logo.png?v=${new Date().getTime()}`} // Add timestamp to avoid caching
            alt="CompeteHQ Logo"
            width={logoWidth}
            height={logoHeight}
            fallback={
              // Fallback to the colored box with "C" if image fails to load
              <Flex
                h="100%"
                w="100%"
                rounded="md"
                bg="primary.600"
                align="center"
                justify="center"
                color="white"
                fontWeight="bold"
                fontSize={size === 'sm' ? '2xs' : size === 'md' ? 'xs' : 'sm'}
              >
                C
              </Flex>
            }
          />
        </Box>
        
        {/* Logo Text */}
        {showText && (
          <Text 
            fontWeight="bold" 
            fontSize={fontSize} 
            color={textColor}
            lineHeight="1"
          >
            competeHQ
          </Text>
        )}
      </Flex>
    </NextLink>
  );
}