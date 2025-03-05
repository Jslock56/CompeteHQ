// src/components/layout/page-container.tsx
import React from 'react';
import { Box, BoxProps, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Heading, Text } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageContainerProps extends BoxProps {
  /**
   * Page title
   */
  title: string;
  
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  
  /**
   * Optional action element to display next to the title
   */
  action?: React.ReactNode;
  
  /**
   * Breadcrumb items for navigation
   */
  breadcrumbs?: BreadcrumbItem[];
  
  /**
   * Main content
   */
  children: React.ReactNode;
}

/**
 * Standard page container component that provides consistent layout
 * for all pages in the application.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  action,
  breadcrumbs,
  children,
  ...props
}) => {
  return (
    <Box px={{ base: 4, md: 6, lg: 8 }} py={8} {...props}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb 
          spacing="2px" 
          separator={<ChevronRightIcon color="gray.500" />}
          mb={4}
          fontSize="sm"
          color="gray.500"
        >
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index} isCurrentPage={index === breadcrumbs.length - 1}>
              {crumb.href ? (
                <NextLink href={crumb.href} passHref>
                  <BreadcrumbLink>{crumb.label}</BreadcrumbLink>
                </NextLink>
              ) : (
                <Text>{crumb.label}</Text>
              )}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      )}
      
      {/* Page Header */}
      <Flex 
        direction={{ base: "column", md: "row" }} 
        justify="space-between" 
        align={{ base: "start", md: "center" }}
        mb={6}
      >
        <Box>
          <Heading as="h1" size="xl" mb={subtitle ? 2 : 0}>{title}</Heading>
          {subtitle && <Text color="gray.600">{subtitle}</Text>}
        </Box>
        
        {action && (
          <Box mt={{ base: 4, md: 0 }}>
            {action}
          </Box>
        )}
      </Flex>
      
      {/* Main Content */}
      {children}
    </Box>
  );
};

export default PageContainer;