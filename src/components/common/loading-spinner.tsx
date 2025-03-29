'use client';

import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

// Types of animation available for the spinner
export type SpinnerAnimationType = 'rotate' | 'pulse' | 'progress';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type?: 'baseball' | 'softball' | 'bat';
  animation?: SpinnerAnimationType;
  thickness?: string;
  color?: string;
  text?: string;
}

// Size mappings
const sizeValues = {
  xs: { size: '1.5rem', fontSize: '0.7rem' },
  sm: { size: '2rem', fontSize: '0.8rem' },
  md: { size: '3rem', fontSize: '0.9rem' },
  lg: { size: '4rem', fontSize: '1rem' },
  xl: { size: '5rem', fontSize: '1.2rem' },
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  type = 'baseball',
  animation = 'rotate',
  thickness = '2px',
  color,
  text,
}) => {
  // Get size values
  const { size: sizeValue, fontSize } = sizeValues[size];
  
  // Animation definitions
  const spin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  `;
  
  const pulse = keyframes`
    0% { transform: scale(0.8); opacity: 0.7; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(0.8); opacity: 0.7; }
  `;
  
  const progress = keyframes`
    0% { width: 0; }
    100% { width: 100%; }
  `;
  
  // Call all color mode hooks together at the top level
  const colors = {
    baseballColor: useColorModeValue('white', 'gray.200'),
    baseballStitchColor: useColorModeValue('blue.500', 'blue.300'),
    softballColor: useColorModeValue('yellow.200', 'yellow.300'),
    softballStitchColor: useColorModeValue('red.500', 'red.300'),
    batColor: useColorModeValue('brown.500', 'brown.300'),
    fillColor: useColorModeValue('teal.500', 'teal.300')
  };
  
  // Animation style based on selected animation type
  const animationStyle = {
    rotate: {
      animation: `${spin} 1.5s linear infinite`,
    },
    pulse: {
      animation: `${pulse} 1.5s ease-in-out infinite`,
    },
    progress: {
      // Progress is handled differently for the bat
      animation: type === 'bat' ? 'none' : `${spin} 1.5s linear infinite`,
    },
  };
  
  // Render baseball spinner
  if (type === 'baseball') {
    return (
      <Flex direction="column" alignItems="center" justifyContent="center">
        <Box
          position="relative"
          width={sizeValue}
          height={sizeValue}
          borderRadius="50%"
          bg={colors.baseballColor}
          boxShadow={`0 0 0 ${thickness} ${color || colors.baseballStitchColor}`}
          {...animationStyle[animation]}
        >
          {/* Baseball stitches */}
          <Box
            position="absolute"
            top="50%"
            left="0"
            right="0"
            height={thickness}
            bg={color || colors.baseballStitchColor}
            transform="translateY(-50%)"
          />
          <Box
            position="absolute"
            top="0"
            bottom="0"
            left="50%"
            width={thickness}
            bg={color || colors.baseballStitchColor}
            transform="translateX(-50%)"
          />
        </Box>
        {text && (
          <Box mt={2} fontSize={fontSize} textAlign="center">
            {text}
          </Box>
        )}
      </Flex>
    );
  }
  
  // Render softball spinner
  if (type === 'softball') {
    return (
      <Flex direction="column" alignItems="center" justifyContent="center">
        <Box
          position="relative"
          width={sizeValue}
          height={sizeValue}
          borderRadius="50%"
          bg={colors.softballColor}
          boxShadow={`0 0 0 ${thickness} ${color || colors.softballStitchColor}`}
          {...animationStyle[animation]}
        >
          {/* Softball stitches */}
          <Box
            position="absolute"
            top="50%"
            left="0"
            right="0"
            height={thickness}
            bg={color || colors.softballStitchColor}
            transform="translateY(-50%)"
          />
          <Box
            position="absolute"
            top="0"
            bottom="0"
            left="50%"
            width={thickness}
            bg={color || colors.softballStitchColor}
            transform="translateX(-50%)"
          />
        </Box>
        {text && (
          <Box mt={2} fontSize={fontSize} textAlign="center">
            {text}
          </Box>
        )}
      </Flex>
    );
  }
  
  // Render bat spinner
  if (type === 'bat') {
    return (
      <Flex direction="column" alignItems="center" justifyContent="center">
        <Box position="relative" width={sizeValue} height="1.5rem">
          {/* Bat shape */}
          <Box
            position="relative"
            width="100%"
            height="100%"
            borderRadius="full"
            bg={colors.baseballColor}
            overflow="hidden"
          >
            {/* Fill animation */}
            {animation === 'progress' ? (
              <Box
                position="absolute"
                height="100%"
                bg={color || colors.fillColor}
                animation={`${progress} 1.5s ease-in-out infinite`}
              />
            ) : (
              <Box
                position="absolute"
                width="100%"
                height="100%"
                bg={color || colors.batColor}
                {...animationStyle[animation]}
              />
            )}
          </Box>
        </Box>
        {text && (
          <Box mt={2} fontSize={fontSize} textAlign="center">
            {text}
          </Box>
        )}
      </Flex>
    );
  }
  
  return null;
};

export default LoadingSpinner;