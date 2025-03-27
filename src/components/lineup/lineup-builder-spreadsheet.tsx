import React, { useState } from 'react';
import { Box, Flex, Button, useToast, IconButton, Collapse } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Game } from '../../types/game';
import { Lineup, Position } from '../../types/lineup';
import { Player } from '../../types/player';
import { useLineup } from '../../hooks/use-lineup';
import LineupGridSpreadsheet from './components/lineup-grid-spreadsheet';
import RosterPanel from './components/roster-panel';
import FairPlayChecker from './components/FairPlayChecker'; // Import the new component

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
  
  // State for roster panel visibility
  const [isRosterVisible, setIsRosterVisible] = useState(true);
  
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
      {/* Replace the existing fair play alert with the new FairPlayChecker component */}
      <FairPlayChecker
        validateLineup={validateLineup}
        fairPlayIssues={fairPlayIssues}
        initialValidation={false} // Start with no validation shown
      />
      
      {/* Main Content Area with Toggle */}
      <Flex width="100%" mb={5}>
        {/* Main Grid Area - Expands to fill available space */}
        <Box flex="1" overflowX="auto">
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
        
        {/* Toggle Button */}
        <IconButton
          aria-label={isRosterVisible ? "Hide roster" : "Show roster"}
          icon={isRosterVisible ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          onClick={() => setIsRosterVisible(!isRosterVisible)}
          size="sm"
          my="auto"
          mx={1}
          variant="ghost"
        />
        
        {/* Roster Panel - Collapsible */}
        <Collapse in={isRosterVisible} style={{ width: '200px' }}>
          <Box width="200px" flexShrink={0}>
            <RosterPanel 
              players={players} 
              lineup={lineup}
              activeInning={activeInning}
              onPlayerSelect={handlePlayerSelect}
            />
          </Box>
        </Collapse>
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