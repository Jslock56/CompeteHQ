'use client';

import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import LoadingSpinner from './loading-spinner';

interface PageLoadingProps {
  type?: 'baseball' | 'softball' | 'bat';
  animation?: 'rotate' | 'pulse' | 'progress';
  text?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({
  type = 'baseball',
  animation = 'pulse',
  text = 'Loading...',
}) => {
  return (
    <Flex 
      justify="center"
      align="center"
      minH="50vh"
      width="100%"
      direction="column"
    >
      <Box mb={4}>
        <LoadingSpinner 
          type={type}
          size="xl"
          animation={animation}
          text={text}
        />
      </Box>
    </Flex>
  );
};

export default PageLoading;