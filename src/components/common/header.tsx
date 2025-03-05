// src/components/common/header.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Box, Flex, Text, IconButton } from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';

interface HeaderProps {
  currentTeam?: {
    id: string;
    name: string;
    ageGroup?: string;
  } | null;
}

const Header: React.FC<HeaderProps> = ({ currentTeam }) => {
  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      h="14"
      px="4"
      bg="white"
      borderBottomWidth="1px"
      borderColor="gray.200"
    >
      <Flex align="center">
        <Link href="/" passHref>
          <Flex align="center">
            <Flex
              h="6"
              w="6"
              rounded="md"
              bg="primary.500"
              align="center"
              justify="center"
              color="white"
              fontWeight="medium"
              fontSize="xs"
              mr="2"
            >
              C
            </Flex>
            <Text fontWeight="bold" fontSize="base" color="gray.800">
              competeHQ
            </Text>
          </Flex>
        </Link>
      </Flex>
      
      {currentTeam && (
        <Flex align="center">
          <Text fontSize="sm" fontWeight="medium" mr="4">
            {currentTeam.name} {currentTeam.ageGroup && `| ${currentTeam.ageGroup}`}
          </Text>
          <IconButton
            aria-label="Settings"
            icon={<SettingsIcon />}
            variant="ghost"
            rounded="full"
            size="sm"
          />
        </Flex>
      )}
    </Flex>
  );
};

export default Header;