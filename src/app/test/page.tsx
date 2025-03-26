'use client';

import React from 'react';
import {
  Box,
  Card as ChakraCard,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Flex
} from '@chakra-ui/react';
import { Card } from '../../components/common/card';
import { PageContainer } from '../../components/layout/page-container';

// Test component to verify Card context issue
export default function TestCardPage() {
  return (
    <PageContainer title="Card Context Test">
      {/* 1. Chakra's Card with CardHeader and CardBody - This works correctly */}
      <ChakraCard mb={6}>
        <CardHeader>
          <Heading size="md">Chakra Card with CardHeader/CardBody</Heading>
        </CardHeader>
        <CardBody>
          <Text>This should work correctly with no context errors.</Text>
        </CardBody>
      </ChakraCard>

      {/* 2. Our custom Card from components/common/card */}
      <Card mb={6} title="Custom Card">
        <Text>This is using our custom Card component with direct children.</Text>
      </Card>

      {/* 3. Our custom Card with Chakra's CardHeader/CardBody - This would cause the context error */}
      {/* 
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Mixing Card Components - Error</Heading>
        </CardHeader>
        <CardBody>
          <Text>This would cause a context error.</Text>
        </CardBody>
      </Card>
      */}

      {/* 4. Fixed version - using custom Box/Flex components like we did in the player page */}
      <Box
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        overflow="hidden"
        shadow="sm"
        mb={6}
      >
        <Flex 
          px={{ base: 4, md: 6 }}
          py={4}
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="gray.200"
        >
          <Heading size="md">Fixed Version</Heading>
        </Flex>
        <Box px={{ base: 4, md: 6 }} py={5}>
          <Text>
            This is the approach we used to fix the context error in the player page.
            It uses basic Box and Flex components instead of CardHeader/CardBody.
          </Text>
        </Box>
      </Box>
    </PageContainer>
  );
}