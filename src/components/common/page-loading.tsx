'use client';

import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import LoadingSpinner from './loading-spinner';

interface PageLoadingProps {
  text?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type?: 'dots' | 'baseball' | 'softball' | 'bat';
  color?: string;
}

/**
 * A full-page loading indicator with a spinner and text
 */
const PageLoading: React.FC<PageLoadingProps> = ({
  text = 'Loading...',
  size = 'lg',
  type = 'dots',
  color,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Flex 
      justify="center"
      align="center"
      minH="50vh"
      width="100%"
      direction="column"
      bg={bgColor}
    >
      <LoadingSpinner 
        type={type}
        size={size}
        text={text}
        color={color}
      />
    </Flex>
  );
};

export default PageLoading;