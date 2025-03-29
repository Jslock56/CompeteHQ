'use client';

import React from 'react';
import { Flex, Text, useColorModeValue } from '@chakra-ui/react';
import SportIcon from './sport-icon';

interface TeamBadgesProps {
  ageGroup?: string;
  season?: string;
  role?: string;
  sport?: 'baseball' | 'softball';
  playerId?: string;
  playerName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const TeamBadges: React.FC<TeamBadgesProps> = ({
  ageGroup,
  season,
  role,
  sport = 'baseball',
  playerId,
  playerName,
  size = 'md',
}) => {
  // Determine text size based on the size prop
  const fontSize = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
  }[size];

  // Format role for display
  const getRoleName = (roleValue: string) => {
    switch (roleValue) {
      case 'headCoach':
        return 'Head Coach';
      case 'assistant':
        return 'Assistant Coach';
      case 'assistantAdmin':
        return 'Assistant Admin';
      case 'fan':
        return playerName ? `Fan of ${playerName}` : 'Fan';
      default:
        return 'Team Member';
    }
  };

  // Join all available info with a separator
  const infoString = [
    ageGroup,
    season,
    role ? getRoleName(role) : undefined,
  ]
    .filter(Boolean)
    .join(' | ');

  if (!infoString) return null;

  return (
    <Flex
      align="center"
      fontSize={fontSize}
      color={useColorModeValue('gray.600', 'gray.400')}
      fontWeight="medium"
    >
      <Text>{infoString}</Text>
    </Flex>
  );
};

export default TeamBadges;