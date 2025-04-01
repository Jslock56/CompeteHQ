'use client';

import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { keyframes, css } from '@emotion/react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type?: 'dots' | 'baseball' | 'softball' | 'bat';
  color?: string;
  text?: string;
}

// Size mappings
const sizeValues = {
  xs: { size: '30px', dotSize: '4px', fontSize: '0.7rem' },
  sm: { size: '40px', dotSize: '5px', fontSize: '0.8rem' },
  md: { size: '60px', dotSize: '7px', fontSize: '0.9rem' },
  lg: { size: '80px', dotSize: '9px', fontSize: '1rem' },
  xl: { size: '100px', dotSize: '11px', fontSize: '1.2rem' },
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  type = 'dots',
  color,
  text,
}) => {
  // Get size values
  const { size: sizeValue, dotSize, fontSize } = sizeValues[size];
  
  const spin = keyframes`
    to {
      transform: rotate(360deg);
    }
  `;

  // Use royal blue for the main dot color if not specified
  const dotColor = color || 'rgb(25, 65, 170)'; // Royal blue

  // Dots spinner (based on reference)
  if (type === 'dots') {
    return (
      <Flex direction="column" alignItems="center" justifyContent="center">
        <Box
          className="spinner"
          position="relative"
          width={sizeValue}
          height={sizeValue}
        >
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              className="dot"
              position="absolute"
              inset="0"
              display="flex"
              justifyContent="center"
              animation={`${spin} 2s infinite`}
              animationDelay={`${i * 100}ms`}
              sx={{
                "&::after": {
                  content: '""',
                  width: dotSize,
                  height: dotSize,
                  borderRadius: "50%",
                  backgroundColor: dotColor,
                }
              }}
            />
          ))}
        </Box>
        {text && (
          <Box mt={4} fontSize={fontSize} textAlign="center">
            {text}
          </Box>
        )}
      </Flex>
    );
  }
  
  // Animation definitions for legacy spinners
  const spinKeyframes = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  `;
  
  const pulseKeyframes = keyframes`
    0% { transform: scale(0.8); opacity: 0.7; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(0.8); opacity: 0.7; }
  `;
  
  const progressKeyframes = keyframes`
    0% { width: 0; }
    100% { width: 100%; }
  `;
  
  // Call all color mode hooks together at the top level
  const colors = {
    baseballColor: useColorModeValue('white', 'gray.200'),
    baseballStitchColor: useColorModeValue(dotColor, 'blue.300'),
    softballColor: useColorModeValue('yellow.200', 'yellow.300'),
    softballStitchColor: useColorModeValue('red.500', 'red.300'),
    batColor: useColorModeValue('brown.500', 'brown.300'),
    fillColor: useColorModeValue('teal.500', 'teal.300')
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
          boxShadow={`0 0 0 2px ${color || colors.baseballStitchColor}`}
          animation={`${spinKeyframes} 1.5s linear infinite`}
        >
          {/* Baseball stitches */}
          <Box
            position="absolute"
            top="50%"
            left="0"
            right="0"
            height="2px"
            bg={color || colors.baseballStitchColor}
            transform="translateY(-50%)"
          />
          <Box
            position="absolute"
            top="0"
            bottom="0"
            left="50%"
            width="2px"
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
          boxShadow={`0 0 0 2px ${color || colors.softballStitchColor}`}
          animation={`${spinKeyframes} 1.5s linear infinite`}
        >
          {/* Softball stitches */}
          <Box
            position="absolute"
            top="50%"
            left="0"
            right="0"
            height="2px"
            bg={color || colors.softballStitchColor}
            transform="translateY(-50%)"
          />
          <Box
            position="absolute"
            top="0"
            bottom="0"
            left="50%"
            width="2px"
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
            {/* Animated fill */}
            <Box
              position="absolute"
              height="100%"
              bg={color || colors.fillColor}
              animation={`${progressKeyframes} 1.5s ease-in-out infinite`}
            />
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