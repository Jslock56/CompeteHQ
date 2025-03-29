import React, { useState } from 'react';
import { Box, Flex, Grid, GridItem, Text, Button, useColorModeValue, IconButton } from '@chakra-ui/react';
import { Position, Lineup } from '../../../types/lineup';
import { Player } from '../../../types/player';
import PositionBadge from '../../common/position-badge';

// Player selector component
import PlayerSelector from './player-selector';

interface FieldPositionBuilderProps {
  /**
   * Current lineup data
   */
  lineup: Lineup;
  
  /**
   * Available players
   */
  players: Player[];
  
  /**
   * Callback when a player is assigned to a position
   */
  onAssignPlayer: (position: Position, playerId: string) => void;
  
  /**
   * Callback when two positions are swapped
   */
  onSwapPositions: (position1: Position, position2: Position) => void;
  
  /**
   * Currently active position (for highlighting)
   */
  activePosition?: Position;
  
  /**
   * Callback when a position is clicked
   */
  onPositionClick?: (position: Position) => void;
}

/**
 * Component for building a field position lineup
 * Displays a baseball field with positions
 */
const FieldPositionBuilder: React.FC<FieldPositionBuilderProps> = ({
  lineup,
  players,
  onAssignPlayer,
  onSwapPositions,
  activePosition,
  onPositionClick
}) => {
  // Get the current inning (for field-position lineups, it's always inning 1)
  const inning = lineup.innings[0];
  
  // Track selected position for swapping
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  
  // Background colors
  const fieldBg = useColorModeValue('green.100', 'green.800');
  const infieldBg = useColorModeValue('orange.100', 'orange.800');
  const positionBg = useColorModeValue('white', 'gray.700');
  const positionBgActive = useColorModeValue('blue.100', 'blue.700');
  const positionBgSelected = useColorModeValue('yellow.100', 'yellow.700');
  
  // Get player assigned to position
  const getPlayerAtPosition = (position: Position): Player | undefined => {
    const assignment = inning.positions.find(pos => pos.position === position);
    if (!assignment || !assignment.playerId) return undefined;
    
    return players.find(player => player.id === assignment.playerId);
  };
  
  // Get bench players (not assigned to any position)
  const getBenchPlayers = (): Player[] => {
    const assignedPlayerIds = inning.positions
      .filter(pos => pos.playerId)
      .map(pos => pos.playerId);
    
    return players.filter(player => !assignedPlayerIds.includes(player.id));
  };
  
  // Handle position click - for selection or activation
  const handlePositionClick = (position: Position) => {
    if (selectedPosition) {
      // If already have a selection, perform swap
      onSwapPositions(selectedPosition, position);
      setSelectedPosition(null);
    } else {
      // First selection, highlight this position
      setSelectedPosition(position);
      
      // Also notify parent if needed
      if (onPositionClick) {
        onPositionClick(position);
      }
    }
  };
  
  // Handle player selection from the selector
  const handlePlayerSelect = (playerId: string) => {
    if (activePosition) {
      onAssignPlayer(activePosition, playerId);
    }
  };
  
  // Render a position cell
  const renderPosition = (position: Position) => {
    const player = getPlayerAtPosition(position);
    const isActive = position === activePosition;
    const isSelected = position === selectedPosition;
    
    // Determine background color based on state
    let bg = positionBg;
    if (isActive) bg = positionBgActive;
    if (isSelected) bg = positionBgSelected;
    
    return (
      <Box
        bg={bg}
        borderRadius="md"
        p={2}
        shadow="md"
        textAlign="center"
        cursor="pointer"
        onClick={() => handlePositionClick(position)}
        transition="all 0.2s"
        _hover={{ transform: 'scale(1.05)' }}
      >
        <PositionBadge position={position} mb={2} />
        
        {player ? (
          <Text fontSize="sm" fontWeight="bold">
            {player.jerseyNumber} - {player.firstName} {player.lastName}
          </Text>
        ) : (
          <Text fontSize="sm" color="gray.500">
            (Empty)
          </Text>
        )}
      </Box>
    );
  };
  
  return (
    <Flex width="100%" direction={{ base: "column", md: "row" }}>
      {/* Baseball Field Visualization - Fixed size container */}
      <Box 
        width={{ base: "100%", md: "70%" }}
        height={{ base: "500px", md: "600px" }}
        bg={fieldBg}
        borderRadius="lg"
        p={4}
        position="relative"
        mr={{ base: 0, md: 4 }}
        mb={{ base: 4, md: 0 }}
        border="2px solid"
        borderColor={useColorModeValue('green.300', 'green.600')}
      >
        {/* Infield dirt */}
        <Box
          position="absolute"
          left="50%"
          top="60%"
          transform="translate(-50%, -50%)"
          width="60%"
          height="60%"
          bg={infieldBg}
          borderRadius="full"
          zIndex={1}
        />
        
        {/* Base paths */}
        <Box
          position="absolute"
          left="50%"
          top="50%"
          transform="translate(-50%, -50%) rotate(45deg)"
          width="50%"
          height="50%"
          border="2px solid"
          borderColor={useColorModeValue('gray.400', 'gray.600')}
          zIndex={2}
        />
        
        {/* Home plate */}
        <Box
          position="absolute"
          left="50%"
          bottom="10%"
          transform="translate(-50%, 0)"
          width="30px"
          height="30px"
          bg="white"
          border="2px solid"
          borderColor="gray.500"
          zIndex={3}
        />
        
        {/* Positions */}
        {/* Pitcher */}
        <Box position="absolute" left="50%" top="60%" transform="translate(-50%, -50%)" zIndex={10} width="100px">
          {renderPosition('P')}
        </Box>
        
        {/* Catcher */}
        <Box position="absolute" left="50%" bottom="5%" transform="translate(-50%, 0)" zIndex={10} width="100px">
          {renderPosition('C')}
        </Box>
        
        {/* First Base */}
        <Box position="absolute" right="20%" top="40%" transform="translate(0, -50%)" zIndex={10} width="100px">
          {renderPosition('1B')}
        </Box>
        
        {/* Second Base */}
        <Box position="absolute" left="50%" top="20%" transform="translate(-50%, 0)" zIndex={10} width="100px">
          {renderPosition('2B')}
        </Box>
        
        {/* Third Base */}
        <Box position="absolute" left="20%" top="40%" transform="translate(0, -50%)" zIndex={10} width="100px">
          {renderPosition('3B')}
        </Box>
        
        {/* Shortstop */}
        <Box position="absolute" left="30%" top="30%" transform="translate(0, 0)" zIndex={10} width="100px">
          {renderPosition('SS')}
        </Box>
        
        {/* Left Field */}
        <Box position="absolute" left="15%" top="15%" transform="translate(0, 0)" zIndex={10} width="100px">
          {renderPosition('LF')}
        </Box>
        
        {/* Center Field */}
        <Box position="absolute" left="50%" top="8%" transform="translate(-50%, 0)" zIndex={10} width="100px">
          {renderPosition('CF')}
        </Box>
        
        {/* Right Field */}
        <Box position="absolute" right="15%" top="15%" transform="translate(0, 0)" zIndex={10} width="100px">
          {renderPosition('RF')}
        </Box>
      </Box>
      
      {/* Bench/Roster Panel */}
      <Box 
        width={{ base: "100%", md: "30%" }}
        bg={useColorModeValue('white', 'gray.700')}
        borderRadius="lg"
        p={4}
        shadow="md"
      >
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          Available Players
        </Text>
        
        <PlayerSelector
          players={getBenchPlayers()}
          onPlayerSelect={handlePlayerSelect}
          selectedPosition={activePosition}
        />
        
        {/* Selection Instructions */}
        <Box mt={4} p={3} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
          <Text fontSize="sm" fontWeight="medium">
            {selectedPosition ? (
              <>
                <strong>{selectedPosition}</strong> selected. Click another position to swap players.
              </>
            ) : (
              <>
                Click a position to select it, then click another position to swap players.
              </>
            )}
          </Text>
        </Box>
        
        {/* Cancel Selection button */}
        {selectedPosition && (
          <Button 
            size="sm" 
            mt={2} 
            colorScheme="gray" 
            onClick={() => setSelectedPosition(null)}
          >
            Cancel Selection
          </Button>
        )}
      </Box>
    </Flex>
  );
};

export default FieldPositionBuilder;