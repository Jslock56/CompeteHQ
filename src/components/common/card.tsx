// src/components/common/card.tsx
import { Box, BoxProps, Flex, Heading, Text } from '@chakra-ui/react';
import React from 'react';

interface CardProps extends BoxProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  subtitle,
  action,
  footer,
  children,
  ...props 
}) => {
  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      overflow="hidden"
      shadow="sm"
      {...props}
    >
      {(title || action) && (
        <Flex 
          px={{ base: 4, md: 6 }}
          py={4}
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="gray.200"
        >
          <Box>
            {title && <Heading size="md">{title}</Heading>}
            {subtitle && <Text color="gray.600" fontSize="sm" mt={1}>{subtitle}</Text>}
          </Box>
          {action && <Box>{action}</Box>}
        </Flex>
      )}
      
      <Box px={{ base: 4, md: 6 }} py={5}>
        {children}
      </Box>
      
      {footer && (
        <Flex
          px={{ base: 4, md: 6 }}
          py={4}
          alignItems="center"
          borderTopWidth={1}
          borderTopColor="gray.200"
          bg="gray.50"
        >
          {footer}
        </Flex>
      )}
    </Box>
  );
};