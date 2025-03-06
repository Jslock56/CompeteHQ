'use client';

import React from 'react';
import { Flex, FlexProps, Tooltip, useTheme } from '@chakra-ui/react';
import { Position } from '../../types/player';

export interface PositionBadgeProps extends FlexProps {
  /**
   * The position code (P, C, 1B, etc.)
   */
  position: Position | string;
  
  /**
   * Whether this is a primary position (affects styling)
   */
  isPrimary?: boolean;
  
  /**
   * Whether to show the tooltip with position description
   */
  showTooltip?: boolean;
  
  /**
   * Size of the badge (default is 'md')
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Position badge component for displaying player positions
 * Used throughout the app for consistent position visualization
 */
export const PositionBadge: React.FC<PositionBadgeProps> = ({
  position,
  isPrimary = true,
  showTooltip = true,
  size = 'md',
  ...props
}) => {
  const theme = useTheme();
  
  // Position descriptions for tooltips
  const positionDescriptions: Record<string, string> = {
    'P': 'Pitcher',
    'C': 'Catcher',
    '1B': 'First Base',
    '2B': 'Second Base',
    '3B': 'Third Base',
    'SS': 'Shortstop',
    'LF': 'Left Field',
    'CF': 'Center Field',
    'RF': 'Right Field',
    'DH': 'Designated Hitter',
    'BN': 'Bench'
  };
  
  // Get the full position description for the tooltip
  const description = positionDescriptions[position] || position;
  
  // Get position color
  const getPositionColor = (pos: string): string => {
    // Use theme colors if available, otherwise use fallbacks
    const positionColors: Record<string, string> = {
      'P': 'red.500',
      'C': 'blue.500',
      '1B': 'green.500',
      '2B': 'orange.500',
      '3B': 'purple.500',
      'SS': 'pink.500',
      'LF': 'indigo.500',
      'CF': 'indigo.500',
      'RF': 'indigo.500',
      'DH': 'cyan.500',
      'BN': 'gray.500',
    };
    
    return positionColors[pos] || 'gray.500';
  };
  
  // Size variations
  const sizeStyles = {
    sm: {
      h: '5',
      w: '5',
      fontSize: 'xs',
    },
    md: {
      h: '6',
      w: '6',
      fontSize: 'xs',
    },
    lg: {
      h: '8',
      w: '8',
      fontSize: 'sm',
    },
  };
  
  // The badge element
  const badge = (
    <Flex
      align="center"
      justify="center"
      borderRadius="full"
      fontWeight="medium"
      color={isPrimary ? "white" : "gray.700"}
      bg={isPrimary ? getPositionColor(position) : "gray.200"}
      {...sizeStyles[size]}
      {...props}
    >
      {position}
    </Flex>
  );
  
  // Wrap in tooltip if requested
  if (showTooltip) {
    return (
      <Tooltip label={description} hasArrow placement="top">
        {badge}
      </Tooltip>
    );
  }
  
  return badge;
};

export default PositionBadge;