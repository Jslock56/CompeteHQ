import React, { useState } from 'react';
import { Box, Flex, Button, Text, Alert, AlertIcon, VStack, useToast, useColorModeValue } from '@chakra-ui/react';
import { Game } from '../../types/game';
import { Lineup, Position } from '../../types/lineup';
import { Player } from '../../types/player';
import { useLineup } from '../../hooks/use-lineup';
import LineupGridSpreadsheet from './lineup-grid-spreadsheet';
import RosterPanel from './roster-panel';

interface LineupBuilderSpreadsheetProps {
  /**
   * Game to create/edit lineup for
   */
  game: Game;
  
  /**
   * Available players
   */
  players: Player[];
  
  /**
   * Initial lineup data (for editing)
   */
  initialLineup?: Lineup;
  
  /**
   * Callback when lineup is saved
   */
  onSave?: (lineup: Lineup) => void;
}

/**
 * Spreadsheet-style lineup builder component
 */
const LineupBuilderSpreadsheet: React.FC<LineupBuilderSpreadsheetProps> = ({
  game,
  players,
  initialLineup,
  onSave
}) => {
  const toast = useToast();
  
  // Initialize the lineup hook
  const {
    lineup,
    assignPlayerToPosition,
    validateLineup,
    saveLineup,
    fairPlayIssues
  } = useLineup({
    gameId: game.id,
    teamId: game.teamId,
    innings: game.innings,
    initialLineup,
    players
  });

  // State for active cell
  const [activePosition, setActivePosition] = useState<Position>('P');
  const [activeInning, setActiveInning] = useState<number>(1);

  // UI colors
  const alertBg = useColorModeValue('yellow.100', 'yellow.800');
  const alertBorderColor = useColorModeValue('yellow.200', 'yellow.700');

  // Handle player selection from roster
  const handlePlayerSelect = (playerId: string) => {
    // Assign player to active position and inning
    assignPlayerToPosition(activeInning, activePosition, playerId);
    
    // Advance to next position
    advanceToNextPosition();
  };

  // Function to advance to the next position
  const advanceToNextPosition = () => {
    // Define the order of positions
    const positionOrder: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
    
    // Find current position index
    const currentIndex = positionOrder.indexOf(activePosition);
    
    if (currentIndex < positionOrder.length - 1) {
      // Move to next position
      setActivePosition(positionOrder[currentIndex + 1]);
    } else {
      // If we're at the last position, check if we should move to the next inning
      if (activeInning < game.innings) {
        setActiveInning(activeInning + 1);
        setActivePosition(positionOrder[0]); // Reset to first position
      }
      
      // Otherwise, stay at the last position of the last inning
    }
  };

  // Handle saving the lineup
  const handleSaveLineup = async () => {
    try {
      // Validate the lineup
      const validationIssues = validateLineup();
      
      if (validationIssues.length > 0) {
        toast({
          title: "Lineup has issues",
          description: "There are some fairness issues with this lineup. You can still save, but consider adjusting the lineup.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Save lineup
      const savedLineup = await saveLineup();
      
      toast({
        title: "Lineup saved",
        description: "The lineup has been saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Call the onSave callback if provided
      if (onSave && savedLineup) {
        onSave(savedLineup);
      }
    } catch (error) {
      toast({
        title: "Failed to save lineup",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box width="100%">
      {/* Fair Play Issues Alert - Only show if there are issues */}
      {fairPlayIssues.length > 0 && (
        <Alert
          status="warning"
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          p={4}
          bg={alertBg}
          borderWidth="1px"
          borderColor={alertBorderColor}
          borderRadius="md"
          mb={6}
        >
          <Flex>
            <AlertIcon />
            <Text fontWeight="bold">Fair Play Issues Detected</Text>
          </Flex>
          <VStack align="stretch" spacing={1} mt={2}>
            {fairPlayIssues.slice(0, 3).map((issue, index) => (
              <Text key={index} fontSize="sm">• {issue}</Text>
            ))}
            {fairPlayIssues.length > 3 && (
              <Text fontSize="sm" color="gray.600">
                + {fairPlayIssues.length - 3} more issues. You&apos;ll be able to review all issues before saving.
              </Text>
            )}
          </VStack>
        </Alert>
      )}
      
      {/* Responsive Container for Lineup Builder */}
      <Flex 
        direction={{ base: 'column', xl: 'row' }} 
        mb={6} 
        width="100%"
        gap={4}
      >
        {/* Lineup Grid - Use maxW to ensure it doesn't grow too large */}
        <Box 
          width="100%" 
          maxWidth={{ base: "100%", xl: "calc(100% - 320px)" }} 
          overflowX="auto"
        >
          <LineupGridSpreadsheet 
            lineup={lineup}
            activePosition={activePosition}
            activeInning={activeInning}
            onCellClick={(position, inning) => {
              setActivePosition(position);
              setActiveInning(inning);
            }}
            players={players}
          />
        </Box>
        
        {/* Roster Panel - Fixed width to prevent it from being pushed off screen */}
        <Box 
          width={{ base: "100%", xl: "300px" }} 
          flexShrink={0}
        >
          <RosterPanel 
            players={players} 
            lineup={lineup}
            activeInning={activeInning}
            onPlayerSelect={handlePlayerSelect}
          />
        </Box>
      </Flex>
      
      <Flex justify="flex-end">
        <Button
          colorScheme="primary"
          onClick={handleSaveLineup}
          size="md"
        >
          Save Lineup
        </Button>
      </Flex>
    </Box>
  );
};

export default LineupBuilderSpreadsheet;