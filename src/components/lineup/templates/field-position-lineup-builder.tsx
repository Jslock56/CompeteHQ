import React, { useState } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Button, 
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Container,
  useColorModeValue,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { Lineup, Position } from '../../types/lineup';
import { Player } from '../../types/player';
import { useLineup } from '../../hooks/use-lineup';
import LineupGridPositionBuilder from './components/lineup-grid-position-builder';
import RosterPanel from './components/roster-panel';

interface FieldPositionLineupBuilderProps {
  /**
   * Team ID
   */
  teamId: string;
  
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
  
  /**
   * Callback when cancel is clicked
   */
  onCancel?: () => void;
}

/**
 * Component for building a field position lineup
 */
const FieldPositionLineupBuilder: React.FC<FieldPositionLineupBuilderProps> = ({
  teamId,
  players,
  initialLineup,
  onSave,
  onCancel
}) => {
  const toast = useToast();
  
  // Initialize the lineup hook
  const {
    lineup,
    assignPlayerToPosition,
    setLineupName,
    setLineupType,
    validateLineup,
    saveLineup,
    fairPlayIssues
  } = useLineup({
    teamId,
    players,
    initialLineup,
    name: initialLineup?.name || 'New Lineup',
    type: initialLineup?.type || 'standard'
  });
  
  // State for active position
  const [activePosition, setActivePosition] = useState<Position>('P');
  
  // Handle player selection
  const handlePlayerSelect = (playerId: string) => {
    // For field-position lineups, always use inning 1
    assignPlayerToPosition(1, activePosition, playerId);
    
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
    }
    // For the last position, stay on it
  };
  
  // Handle position cell click
  const handlePositionClick = (position: Position) => {
    setActivePosition(position);
  };
  
  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLineupName(e.target.value);
  };
  
  // Handle type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLineupType(e.target.value as 'standard' | 'competitive' | 'developmental');
  };
  
  // Handle save
  const handleSave = async () => {
    try {
      // Validate the lineup
      const validationIssues = validateLineup();
      
      // Check if all positions are filled
      const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
      const inning = lineup.innings[0];
      const missingPositions = positions.filter(pos => 
        !inning.positions.some(p => p.position === pos && p.playerId)
      );
      
      if (missingPositions.length > 0) {
        toast({
          title: "Incomplete lineup",
          description: `Please assign players to all positions. Missing: ${missingPositions.join(', ')}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Save lineup
      const savedLineup = await saveLineup();
      
      if (savedLineup) {
        toast({
          title: "Lineup saved",
          description: "The lineup has been saved successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Call the onSave callback if provided
        if (onSave) {
          onSave(savedLineup);
        }
      } else {
        throw new Error("Failed to save lineup");
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
      {/* Lineup Information Form */}
      <Box 
        bg={useColorModeValue('white', 'gray.700')}
        p={4}
        borderRadius="md"
        shadow="sm"
        mb={6}
        borderWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.600')}
      >
        <Heading size="md" mb={4}>Lineup Details</Heading>
        
        <Flex 
          direction={{ base: "column", md: "row" }} 
          gap={4}
        >
          <FormControl id="lineup-name" isRequired flex={1}>
            <FormLabel>Lineup Name</FormLabel>
            <Input 
              placeholder="e.g., Tournament Lineup or Regular Season"
              value={lineup.name || ''}
              onChange={handleNameChange}
            />
          </FormControl>
          
          <FormControl id="lineup-type" isRequired width={{ base: "100%", md: "200px" }}>
            <FormLabel>Lineup Type</FormLabel>
            <Select 
              value={lineup.type || 'standard'}
              onChange={handleTypeChange}
            >
              <option value="standard">Standard</option>
              <option value="competitive">Competitive</option>
              <option value="developmental">Developmental</option>
            </Select>
          </FormControl>
        </Flex>
      </Box>
      
      {/* Lineup Builder Grid */}
      <Grid 
        templateColumns={{ base: "1fr", md: "2fr 1fr" }}
        gap={6}
        mb={6}
      >
        {/* Position Grid - Takes 2/3 of the width on larger screens */}
        <GridItem 
          bg={useColorModeValue('white', 'gray.700')}
          p={4}
          borderRadius="md"
          shadow="sm"
          borderWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.600')}
        >
          <Heading size="sm" mb={4}>Field Positions</Heading>
          
          <LineupGridPositionBuilder
            lineup={lineup}
            players={players}
            activePosition={activePosition}
            onPositionClick={handlePositionClick}
          />
        </GridItem>
        
        {/* Roster Panel - Takes 1/3 of the width on larger screens */}
        <GridItem>
          <RosterPanel 
            players={players}
            lineup={lineup}
            activeInning={1}
            activePosition={activePosition}
            onPlayerSelect={handlePlayerSelect}
          />
        </GridItem>
      </Grid>
      
      {/* Action Buttons */}
      <Flex justify="flex-end" gap={4}>
        {onCancel && (
          <Button
            colorScheme="gray"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        
        <Button
          colorScheme="primary"
          onClick={handleSave}
        >
          Save Lineup
        </Button>
      </Flex>
    </Box>
  );
};

export default FieldPositionLineupBuilder;