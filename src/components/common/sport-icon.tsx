'use client';

import React from 'react';
import { Box, Icon, useColorModeValue } from '@chakra-ui/react';
import { FaBaseballBall } from 'react-icons/fa';

interface SportIconProps {
  sport: 'baseball' | 'softball';
  size?: string | number;
  inline?: boolean;
}

const SportIcon: React.FC<SportIconProps> = ({ sport, size = '1em', inline = false }) => {
  // Colors for different sports
  const baseballFill = useColorModeValue('white', 'gray.100');
  const baseballStitches = useColorModeValue('blue.500', 'blue.300');
  const softballFill = useColorModeValue('yellow.200', 'yellow.100');
  const softballStitches = useColorModeValue('red.500', 'red.300');

  if (sport === 'baseball') {
    return (
      <Box 
        as="span" 
        display={inline ? 'inline-flex' : 'flex'} 
        alignItems="center" 
        justifyContent="center"
        verticalAlign="middle"
      >
        <Icon 
          as={FaBaseballBall} 
          color={baseballStitches} 
          bg={baseballFill} 
          borderRadius="full"
          boxSize={size}
        />
      </Box>
    );
  } 
  
  if (sport === 'softball') {
    return (
      <Box 
        as="span" 
        display={inline ? 'inline-flex' : 'flex'} 
        alignItems="center" 
        justifyContent="center"
        verticalAlign="middle"
      >
        <Icon 
          as={FaBaseballBall} 
          color={softballStitches} 
          bg={softballFill} 
          borderRadius="full"
          boxSize={size}
        />
      </Box>
    );
  }

  return null;
};

export default SportIcon;