'use client';

import React from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  Heading,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { Game } from '../../types/game';
import { Lineup, Position } from '../../types/lineup';
import { Player } from '../../types/player';
import InningTabs from './inning-tabs';
import LineupGrid from './lineup-grid';
import { useLineup } from '../../hooks/use-lineup';

interface LineupBuilderProps {
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
 * Main lineup builder component
 */
const LineupBuilder: React.FC<LineupBuilderProps> = ({
  game,
  players,
  initialLineup,
  onSave
}) => {
  const toast = useToast();
  
  // Initialize the lineup hook
  const {
    lineup,
    currentInning,
    setCurrentInning,
    assignPlayerToPosition,
    copyFromPreviousInning,
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
  
  // UI state colors
  const alertBg = useColorModeValue('yellow.100', 'yellow.800');
  const alertBorderColor = useColorModeValue('yellow.200', 'yellow.700');
  
  // Handle player assignment
  const handleAssignPlayer = (position: string, playerId: string) => {
    assignPlayerToPosition(currentInning, position as Position, playerId);
  };
  
  // Handle saving the lineup
  const handleSaveLineup = async () => {
    try {
      // First, validate the lineup
      const validationIssues = validateLineup();
      
      if (validationIssues.length > 0) {
        // Show validation issues but allow saving anyway
        toast({
          title: "Lineup has issues",
          description: "There are some fairness issues with this lineup. You can still save, but consider adjusting the lineup.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Save lineup (gets the saved lineup object back)
      const savedLineup = await saveLineup();
      
      // Show success message
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
  
  // Determine if we can copy from a previous inning
  const canCopyFromPrevious = currentInning > 1;
  
  // Handle copying from previous inning
  const handleCopyFromPrevious = () => {
    if (canCopyFromPrevious) {
      copyFromPreviousInning(currentInning);
      
      toast({
        title: "Inning copied",
        description: `Copied assignments from inning ${currentInning - 1} to inning ${currentInning}`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Create an array of inning contents for the tab panels
  const inningContents = Array.from({ length: game.innings }, (_, i) => {
    const inningNumber = i + 1;
    const inningData = lineup.innings.find(inning => inning.inning === inningNumber) || 
      { inning: inningNumber, positions: [] };
    
    return (
      <LineupGrid
        key={`inning-${inningNumber}`}
        inning={inningData}
        players={players}
        onAssignPlayer={handleAssignPlayer}
        onCopyPrevious={handleCopyFromPrevious}
        hasPreviousInning={inningNumber > 1}
      />
    );
  });
  
  return (
    <Box>
      {/* Fair Play Alerts */}
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
            <AlertTitle fontSize="lg" mr={2}>
              Fair Play Issues Detected
            </AlertTitle>
          </Flex>
          <AlertDescription mt={2}>
            <VStack align="stretch" spacing={1}>
              {fairPlayIssues.map((issue, index) => (
                <Text key={index}>• {issue}</Text>
              ))}
            </VStack>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Game Information */}
      <Box mb={6}>
        <Flex justify="space-between" align="flex-end">
          <Box>
            <Heading as="h2" size="md" mb={1}>
              Lineup: vs. {game.opponent}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {new Date(game.date).toLocaleDateString()} • {game.location} • {game.innings} innings
            </Text>
          </Box>
          <Button
            colorScheme="primary"
            onClick={handleSaveLineup}
          >
            Save Lineup
          </Button>
        </Flex>
      </Box>
      
      {/* Inning Tabs & Position Grid */}
      <InningTabs
        innings={game.innings}
        currentInning={currentInning}
        onInningChange={setCurrentInning}
      >
        {inningContents}
      </InningTabs>
    </Box>
  );
};

export default LineupBuilder;