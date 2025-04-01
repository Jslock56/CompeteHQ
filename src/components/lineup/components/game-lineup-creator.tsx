import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Text,
  VStack,
  HStack,
  Select,
  Checkbox,
  FormHelperText,
  Flex,
  useColorModeValue,
  Divider,
  SimpleGrid,
  Container,
  Badge,
  Alert,
  AlertIcon,
  Switch,
  Icon,
  Tooltip,
  Grid,
  GridItem,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { InfoIcon, ChevronRightIcon, CalendarIcon, TimeIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { Game } from '../../../types/game';
import { Lineup, Position } from '../../../types/lineup';
import { Player } from '../../../types/player';
import { useFieldPositionLineups, useLineup } from '../../../hooks/use-lineup';
import { useTeamContext } from '../../../contexts/team-context';
import FairPlayChecker from './FairPlayChecker';
import { generateGameLineup } from '../../../utils/game-lineup-generator'; 
import LineupGridPositionBuilder from './lineup-grid-position-builder';
import RosterPanel from './roster-panel';
import InningTabs from '../inning-tabs';
import { v4 as uuidv4 } from 'uuid';

interface GameLineupCreatorProps {
  game: Game;
  players: Player[];
  onLineupGenerated: (lineup: Lineup) => void;
  existingLineup?: Lineup | null;
}

/**
 * Component to create a game-specific lineup with fair play options
 */
const GameLineupCreator: React.FC<GameLineupCreatorProps> = ({ 
  game, 
  players,
  onLineupGenerated,
  existingLineup
}) => {
  const router = useRouter();
  const toast = useToast();
  const { currentTeam } = useTeamContext();
  const { lineups: templateLineups, isLoading } = useFieldPositionLineups(game.teamId);
  
  // Helper function to calculate player stats across all innings
  const calculatePlayerStats = (playerId: string, lineup: Lineup) => {
    const fieldPositions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
    const infieldPositions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS'];
    const outfieldPositions: Position[] = ['LF', 'CF', 'RF'];
    
    let totalPlayingInnings = 0;
    let benchInnings = 0;
    let infieldInnings = 0;
    let outfieldInnings = 0;
    let pitcherInnings = 0;
    let catcherInnings = 0;
    
    // Calculate innings for each category
    lineup.innings.forEach(inning => {
      // Check if player is in any field position this inning
      const playerAssignment = inning.positions.find(pos => 
        pos.playerId === playerId && fieldPositions.includes(pos.position)
      );
      
      if (playerAssignment) {
        totalPlayingInnings++;
        
        // Check position category
        if (infieldPositions.includes(playerAssignment.position)) {
          infieldInnings++;
        }
        
        if (outfieldPositions.includes(playerAssignment.position)) {
          outfieldInnings++;
        }
        
        if (playerAssignment.position === 'P') {
          pitcherInnings++;
        }
        
        if (playerAssignment.position === 'C') {
          catcherInnings++;
        }
      } else {
        benchInnings++;
      }
    });
    
    // Calculate playing percentage
    const playingPercentage = Math.round((totalPlayingInnings / lineup.innings.length) * 100);
    
    return {
      totalPlayingInnings,
      benchInnings,
      infieldInnings,
      outfieldInnings,
      pitcherInnings,
      catcherInnings,
      playingPercentage
    };
  };

  // Form state
  const [lineupType, setLineupType] = useState<'standard' | 'competitive' | 'developmental'>('standard');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [useRollingBattingOrder, setUseRollingBattingOrder] = useState<boolean>(false);
  const [enableFairPlay, setEnableFairPlay] = useState<boolean>(true);
  
  // Fair play rules state
  const [fairPlayRules, setFairPlayRules] = useState({
    noConsecutiveBench: true,
    noDoubleBeforeAll: true,
    noConsecutiveGameBench: true,
    atLeastOneInfield: true
  });

  // Player availability
  const [unavailablePlayers, setUnavailablePlayers] = useState<string[]>([]);

  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Handle generating the lineup
  // State for active position when editing
  const [activePosition, setActivePosition] = useState<Position>('P');
  const [generatedLineup, setGeneratedLineup] = useState<Lineup | null>(existingLineup || null);
  const [viewingInning, setViewingInning] = useState(1);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  
  // Initialize the lineup hook for manual editing
  const {
    lineup: editableLineup,
    assignPlayerToPosition,
    validateLineup,
    saveLineup
  } = useLineup({
    teamId: game.teamId,
    players,
    name: `${game.opponent} Game Lineup`,
    type: lineupType,
    initialLineup: existingLineup
  });
  
  // Update state when an existing lineup is provided
  useEffect(() => {
    if (existingLineup && !generatedLineup) {
      setGeneratedLineup(existingLineup);
      
      // Set lineup type based on existing lineup
      if (existingLineup.type) {
        setLineupType(existingLineup.type as any);
      }
      
      // Disable fair play for existing lineups (assuming they've already been validated)
      setEnableFairPlay(false);
      
      toast({
        title: "Lineup loaded",
        description: "Existing lineup loaded for editing.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [existingLineup, toast, generatedLineup]);

  // Handle position cell click
  const handlePositionClick = (position: Position) => {
    setActivePosition(position);
  };
  
  // Handle player selection
  const handlePlayerSelect = (playerId: string) => {
    if (generatedLineup) {
      // Update the generated lineup
      const updatedLineup = {...generatedLineup};
      const inning = updatedLineup.innings.find(i => i.inning === viewingInning);
      
      if (inning) {
        // Find if this position already has an assignment
        const existingIndex = inning.positions.findIndex(p => p.position === activePosition);
        
        if (existingIndex !== -1) {
          // Update existing assignment
          inning.positions[existingIndex].playerId = playerId;
        } else {
          // Add new assignment
          inning.positions.push({
            position: activePosition,
            playerId: playerId
          });
        }
        
        setGeneratedLineup(updatedLineup);
      }
    } else {
      // No generated lineup yet, use the editable lineup
      assignPlayerToPosition(viewingInning, activePosition, playerId);
    }
  };

  const handleGenerateLineup = () => {
    try {
      // Find the selected template lineup
      const templateLineup = selectedTemplateId 
        ? templateLineups.find(l => l.id === selectedTemplateId)
        : null;
      
      // Get available players (filter out unavailable)
      const availablePlayers = players.filter(p => 
        p.active && !unavailablePlayers.includes(p.id)
      );

      // Log configuration
      console.log("Generating lineup with configuration:", {
        gameId: game.id,
        teamId: game.teamId,
        innings: game.innings,
        availablePlayers: availablePlayers.length,
        lineupType,
        fairPlayEnabled: enableFairPlay
      });

      // Generate lineup with our utility
      const newLineup = generateGameLineup({
        gameId: game.id,
        teamId: game.teamId,
        innings: game.innings,
        players: availablePlayers,
        templateLineup,
        lineupType,
        fairPlaySettings: enableFairPlay ? {
          noConsecutiveBench: fairPlayRules.noConsecutiveBench,
          noDoubleBeforeAll: fairPlayRules.noDoubleBeforeAll,
          noConsecutiveGameBench: fairPlayRules.noConsecutiveGameBench,
          atLeastOneInfield: fairPlayRules.atLeastOneInfield
        } : null
      });

      // Ensure the lineup has the correct number of innings
      if (newLineup.innings.length !== game.innings) {
        console.log(`Fixing innings count - Expected: ${game.innings}, Actual: ${newLineup.innings.length}`);
        
        // Update innings array to match game.innings
        newLineup.innings = Array.from({ length: game.innings }, (_, i) => {
          const inningNumber = i + 1;
          // Use existing inning data if available, otherwise create new inning
          const existingInning = newLineup.innings.find(inn => inn.inning === inningNumber);
          return existingInning || { inning: inningNumber, positions: [] };
        });
      }

      console.log("Generated lineup:", newLineup);
      
      // Store the generated lineup in state
      setGeneratedLineup(newLineup);
      
      // Reset to first inning view
      setViewingInning(1);

      // Show success message
      toast({
        title: "Lineup generated",
        description: "Your game lineup has been created successfully. You can now edit it or save it.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error("Error generating lineup:", error);
      toast({
        title: "Error",
        description: "Failed to generate lineup. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle saving the lineup
  const handleSaveLineup = async () => {
    if (generatedLineup) {
      // Try to save directly to the database first
      try {
        const apiUrl = `/api/games/${game.id}/lineup`;
        // Add a flag to indicate this should be stored in the gameLineups collection
        const lineupWithFlag = {
          ...generatedLineup,
          collectionType: 'gameLineups'
        };
        
        console.log(`Saving game lineup to MongoDB: ${apiUrl}`);
        console.log(`Request payload: ${JSON.stringify({ lineup: lineupWithFlag }, null, 2)}`);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lineup: lineupWithFlag }),
          credentials: 'include' // Ensure cookies are sent with the request
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.lineup) {
            console.log('Successfully saved game lineup to database');
            
            // Pass the final lineup to parent component
            onLineupGenerated(data.lineup);
            
            toast({
              title: "Lineup saved",
              description: "Your game lineup has been saved to the database successfully.",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            return;
          } else {
            console.warn('API response was OK but data format was unexpected:', data);
          }
        } else {
          console.warn(`API returned status ${response.status} when saving game lineup`);
          try {
            const errorData = await response.json();
            console.warn('Error details:', errorData);
          } catch (e) {
            console.warn('Could not parse error response:', e);
          }
        }
      } catch (apiError) {
        console.error('Error during direct API save:', apiError);
      }
      
      // Fall back to passing the lineup to the parent component
      console.log('Falling back to passing lineup to parent component');
      onLineupGenerated(generatedLineup);
      
      toast({
        title: "Lineup saved",
        description: "Your game lineup has been saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Format game date for display
  const formatGameDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      dateStr: format(date, 'EEEE, MMMM d, yyyy'),
      timeStr: format(date, 'h:mm a')
    };
  };

  const { dateStr, timeStr } = formatGameDate(game.date);
  
  // Enhanced debug logging for innings value issues
  console.log("GAME LINEUP DEBUG - Game details in creator:", {
    opponent: game.opponent,
    innings: game.innings,
    inningsType: typeof game.innings,
    inningsValue: game.innings ? "defined" : "undefined",
    location: game.location,
    date: game.date,
    gameFull: game
  });

  // Toggle player availability
  const togglePlayerAvailability = (playerId: string) => {
    setUnavailablePlayers(current => {
      if (current.includes(playerId)) {
        return current.filter(id => id !== playerId);
      } else {
        return [...current, playerId];
      }
    });
  };

  return (
    <Container maxW="6xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Game Info Header */}
        <Box 
          borderWidth="1px" 
          borderRadius="lg" 
          overflow="hidden"
          bg={cardBg}
          borderColor={borderColor}
        >
          <Flex 
            p={3} 
            bg={headerBg} 
            borderBottomWidth="1px"
            borderColor={borderColor}
            direction="column"
          >
            <Heading size="sm">Game: vs {game.opponent}</Heading>
          </Flex>
          
          <Box p={3}>
            <Flex wrap="wrap" justifyContent="flex-start" gap={4}>
            <HStack spacing={2} color="gray.600">
              <Icon as={CalendarIcon} boxSize={4} />
              <Text>{dateStr} at {timeStr}</Text>
            </HStack>
            
            <HStack spacing={2} color="gray.600">
              <Icon as={FaMapMarkerAlt} boxSize={4} />
              <Text>{game.location}</Text>
            </HStack>
            
            <HStack spacing={2} color="gray.600">
              <Icon as={TimeIcon} boxSize={4} />
              <Text fontWeight="medium">{game.innings} innings</Text>
            </HStack>
          </Flex>
          </Box>
        </Box>
        
        {/* Main content area - either configuration or lineup editor */}
        {!generatedLineup ? (
          <>
            {/* Lineup Configuration Options */}
            <Box 
              borderWidth="1px" 
              borderRadius="lg" 
              overflow="hidden"
              bg={cardBg}
              borderColor={borderColor}
            >
              <Flex 
                p={3} 
                bg={headerBg} 
                borderBottomWidth="1px"
                borderColor={borderColor}
                direction="column"
              >
                <Heading size="md">Lineup Configuration</Heading>
                <Text color="gray.500" fontSize="sm">
                  Configure how you want to generate the lineup
                </Text>
              </Flex>
              
              <Box p={4}>
                <VStack spacing={4} align="flex-start">
                  {/* Lineup Type */}
                  <FormControl>
                    <FormLabel fontWeight="semibold">Select Lineup Type</FormLabel>
                    <Select 
                      value={lineupType} 
                      onChange={(e) => setLineupType(e.target.value as any)}
                    >
                      <option value="standard">Standard (Balanced positions)</option>
                      <option value="competitive">Competitive (Favor primary positions)</option>
                      <option value="developmental">Developmental (Favor secondary positions)</option>
                    </Select>
                    <FormHelperText>
                      This affects how players are assigned to positions during rotation
                    </FormHelperText>
                  </FormControl>
    
                  {/* Template Selection */}
                  <FormControl>
                    <FormLabel fontWeight="semibold">Select Starting Lineup Template</FormLabel>
                    <Select 
                      value={selectedTemplateId} 
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      placeholder="-- Select a template --"
                      isDisabled={isLoading || templateLineups.length === 0}
                    >
                      {templateLineups.map(lineup => (
                        <option key={lineup.id} value={lineup.id}>
                          {lineup.name} {lineup.isDefault && '(Default)'}
                        </option>
                      ))}
                    </Select>
                    <FormHelperText>
                      You can start from a saved lineup template as your 1st inning lineup
                    </FormHelperText>
                    {isLoading && (
                      <Text fontSize="sm" color="gray.500" mt={1}>Loading templates...</Text>
                    )}
                    {!isLoading && templateLineups.length === 0 && (
                      <Alert status="info" mt={2} size="sm">
                        <AlertIcon />
                        No saved templates found. You can create templates in the lineup section.
                      </Alert>
                    )}
                  </FormControl>
                </VStack>
              </Box>
            </Box>
    
            {/* Fair Play Rules */}
            <Box 
              borderWidth="1px" 
              borderRadius="lg" 
              overflow="hidden"
              bg={cardBg}
              borderColor={borderColor}
            >
              <Flex 
                p={3} 
                bg={headerBg} 
                borderBottomWidth="1px"
                borderColor={borderColor}
                justify="space-between"
                align="center"
              >
                <Box>
                  <Heading size="md">Fair Play Rules</Heading>
                  <Text color="gray.500" fontSize="sm">
                    Configure rules for balanced player participation
                  </Text>
                </Box>
                <FormControl display="flex" alignItems="center" width="auto">
                  <FormLabel htmlFor="enable-fair-play" mb="0" mr={3} fontWeight="semibold">
                    Enable Fair Play
                  </FormLabel>
                  <Switch 
                    id="enable-fair-play" 
                    isChecked={enableFairPlay} 
                    onChange={() => setEnableFairPlay(!enableFairPlay)}
                    colorScheme="primary"
                    size="lg"
                  />
                </FormControl>
              </Flex>
              
              <Box p={4}>
                {enableFairPlay ? (
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" mb={1}>
                      Select which fair play rules to apply when generating the lineup:
                    </Text>
    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={3}>
                      <FormControl display="flex" alignItems="flex-start">
                        <Checkbox 
                          isChecked={fairPlayRules.noConsecutiveBench} 
                          onChange={() => setFairPlayRules({...fairPlayRules, noConsecutiveBench: !fairPlayRules.noConsecutiveBench})}
                          colorScheme="primary"
                          mr={2}
                          mt={1}
                        />
                        <Box>
                          <Text fontWeight="medium">No player sits out two innings in a row</Text>
                          <Text fontSize="sm" color="gray.500">
                            If a player is benched for one inning, they will play in the next inning
                          </Text>
                        </Box>
                      </FormControl>
    
                      <FormControl display="flex" alignItems="flex-start">
                        <Checkbox 
                          isChecked={fairPlayRules.noDoubleBeforeAll} 
                          onChange={() => setFairPlayRules({...fairPlayRules, noDoubleBeforeAll: !fairPlayRules.noDoubleBeforeAll})}
                          colorScheme="primary"
                          mr={2}
                          mt={1}
                        />
                        <Box>
                          <Text fontWeight="medium">No player sits out twice until everyone has sat once</Text>
                          <Text fontSize="sm" color="gray.500">
                            Spreads bench time fairly among all players
                          </Text>
                        </Box>
                      </FormControl>
    
                      <FormControl display="flex" alignItems="flex-start">
                        <Checkbox 
                          isChecked={fairPlayRules.atLeastOneInfield} 
                          onChange={() => setFairPlayRules({...fairPlayRules, atLeastOneInfield: !fairPlayRules.atLeastOneInfield})}
                          colorScheme="primary"
                          mr={2}
                          mt={1}
                        />
                        <Box>
                          <Text fontWeight="medium">Each player gets at least one infield inning</Text>
                          <Text fontSize="sm" color="gray.500">
                            Ensures every player plays an infield position at least once
                          </Text>
                        </Box>
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="flex-start">
                        <Checkbox 
                          isChecked={fairPlayRules.noConsecutiveGameBench} 
                          onChange={() => setFairPlayRules({...fairPlayRules, noConsecutiveGameBench: !fairPlayRules.noConsecutiveGameBench})}
                          colorScheme="primary"
                          mr={2}
                          mt={1}
                        />
                        <Box>
                          <Text fontWeight="medium">No player starts on the bench two games in a row</Text>
                          <Text fontSize="sm" color="gray.500">
                            Players who didn't start last game will start in this game
                          </Text>
                        </Box>
                      </FormControl>
                    </SimpleGrid>
    
                    <Divider my={2} />
    
                    {/* Unavailable Players Section */}
                    <Box mt={1}>
                      <Text fontWeight="semibold" mb={2}>Mark Unavailable Players</Text>
                      <Text fontSize="sm" color="gray.500" mb={3}>
                        Select players who are not available for this game:
                      </Text>
    
                      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                        {players.filter(p => p.active).map(player => (
                          <Box 
                            key={player.id}
                            borderWidth="1px"
                            borderRadius="md"
                            p={2}
                            bg={unavailablePlayers.includes(player.id) ? "gray.100" : "white"}
                            onClick={() => togglePlayerAvailability(player.id)}
                            cursor="pointer"
                            _hover={{ bg: "gray.50" }}
                            transition="background 0.2s"
                          >
                            <Flex align="center">
                              <Checkbox 
                                isChecked={unavailablePlayers.includes(player.id)} 
                                onChange={() => togglePlayerAvailability(player.id)}
                                colorScheme="primary"
                                mr={2}
                              />
                              <Flex direction="column">
                                <Text fontWeight="medium" fontSize="sm">
                                  {player.firstName} {player.lastName}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  #{player.jerseyNumber}
                                </Text>
                              </Flex>
                            </Flex>
                          </Box>
                        ))}
                      </SimpleGrid>
                      
                      {players.filter(p => p.active).length === 0 && (
                        <Alert status="warning" mt={2}>
                          <AlertIcon />
                          No active players found on the roster.
                        </Alert>
                      )}
                    </Box>
                  </VStack>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    Fair play rules are disabled. Players will stay in their assigned positions for all innings.
                  </Alert>
                )}
              </Box>
            </Box>
    
            {/* Generate Button */}
            <Flex justify="center" mt={4}>
              <Button 
                size="lg" 
                colorScheme="primary" 
                onClick={handleGenerateLineup}
                px={10}
                isDisabled={isLoading || (players.filter(p => p.active).length - unavailablePlayers.length < 9)}
              >
                Generate Lineup
              </Button>
            </Flex>
            
            {/* Message if not enough available players */}
            {players.filter(p => p.active).length - unavailablePlayers.length < 9 && (
              <Alert status="error" mt={2}>
                <AlertIcon />
                Not enough available players to generate a lineup. You need at least 9 available players.
              </Alert>
            )}
          </>
        ) : (
          <>
            {/* Lineup Editor Display */}
            <Box 
              borderWidth="1px" 
              borderRadius="lg" 
              overflow="hidden"
              bg={cardBg}
              borderColor={borderColor}
              mb={4}
            >
              <Flex 
                p={3} 
                bg={headerBg} 
                borderBottomWidth="1px"
                borderColor={borderColor}
                align="center"
              >
                <Heading size="md">Lineup Editor</Heading>
                <Text fontSize="sm" ml={2} color="gray.500">
                  (All Innings View)
                </Text>
              </Flex>
              
              <Box p={4}>
                {/* All Innings Compact View */}
                <Grid templateColumns={{ base: "1fr", lg: "3fr 1fr" }} gap={4}>
                  {/* Multi-Inning Grid - Left Side */}
                  <Box 
                    borderWidth="1px"
                    borderRadius="md"
                    p={3}
                    overflowX="auto"
                  >
                    {/* Position header row */}
                    <Flex mb={2} fontWeight="bold" fontSize="sm">
                      <Box width="60px" flexShrink={0}>Position</Box>
                      {Array.from({ length: game.innings }).map((_, index) => (
                        <Box 
                          key={index} 
                          width="180px" 
                          textAlign="center"
                          flexShrink={0}
                          fontWeight="semibold"
                          p={1}
                          bg={headerBg}
                          borderRadius="md"
                          mx={1}
                        >
                          Inning {index + 1}
                        </Box>
                      ))}
                    </Flex>

                    {/* Position rows */}
                    {['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'].map((position) => (
                      <Flex 
                        key={position} 
                        mb={2} 
                        alignItems="center"
                        borderBottomWidth="1px"
                        borderColor="gray.100"
                        pb={2}
                      >
                        <Box 
                          width="60px" 
                          flexShrink={0}
                          display="flex"
                          justifyContent="center"
                        >
                          {/* Use position colors from PositionBadge */}
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="white"
                            bg={
                              position === 'P' ? 'red.500' :
                              position === 'C' ? 'blue.500' :
                              position === '1B' ? 'green.500' :
                              position === '2B' ? 'orange.500' :
                              position === '3B' ? 'purple.500' :
                              position === 'SS' ? 'pink.500' :
                              position === 'LF' ? 'teal.500' :
                              position === 'CF' ? 'cyan.500' :
                              position === 'RF' ? 'blue.300' :
                              'gray.500'
                            }
                            borderRadius="full"
                            px={2}
                            py={1}
                          >
                            {position}
                          </Text>
                        </Box>
                        
                        {/* Positions for each inning */}
                        {Array.from({ length: game.innings }).map((_, inningIndex) => {
                          const inningNum = inningIndex + 1;
                          const inning = generatedLineup.innings.find(i => i.inning === inningNum);
                          const assignment = inning?.positions.find(p => p.position === position);
                          const player = assignment ? players.find(p => p.id === assignment.playerId) : null;
                          
                          const isActive = activePosition === position && viewingInning === inningNum;
                          
                          return (
                            <Box 
                              key={inningIndex}
                              width="180px"
                              flexShrink={0}
                              mx={1}
                              p={1}
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor={isActive ? "blue.300" : "gray.200"}
                              bg={isActive ? "blue.50" : "white"}
                              cursor="pointer"
                              onClick={() => {
                                setActivePosition(position as Position);
                                setViewingInning(inningNum);
                              }}
                              _hover={{
                                bg: isActive ? "blue.50" : "gray.50"
                              }}
                            >
                              {player ? (
                                <Flex alignItems="center">
                                  <Text
                                    fontWeight="bold"
                                    fontSize="xs"
                                    bg="gray.100"
                                    color="gray.800"
                                    borderRadius="full"
                                    px={1.5}
                                    py={0.5}
                                    minWidth="20px"
                                    textAlign="center"
                                    mr={1.5}
                                  >
                                    {player.jerseyNumber}
                                  </Text>
                                  <Text fontSize="xs" isTruncated>
                                    {player.lastName}, {player.firstName.charAt(0)}
                                  </Text>
                                </Flex>
                              ) : (
                                <Text fontSize="xs" color="gray.400" textAlign="center">
                                  Empty
                                </Text>
                              )}
                            </Box>
                          );
                        })}
                      </Flex>
                    ))}
                    
                    {/* Bench row */}
                    <Flex 
                      alignItems="center"
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      pb={2}
                      mt={3}
                      bg="gray.50"
                      borderRadius="md"
                      p={2}
                    >
                      <Box 
                        width="60px" 
                        flexShrink={0}
                        display="flex"
                        justifyContent="center"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          bg="gray.500"
                          color="white"
                          borderRadius="full"
                          px={2}
                          py={1}
                        >
                          BENCH
                        </Text>
                      </Box>
                      
                      {/* Bench for each inning */}
                      {Array.from({ length: game.innings }).map((_, inningIndex) => {
                        const inningNum = inningIndex + 1;
                        const inning = generatedLineup.innings.find(i => i.inning === inningNum);
                        const fieldPositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
                        
                        // Get players on the field
                        const fieldPlayerIds = inning?.positions
                          .filter(p => fieldPositions.includes(p.position))
                          .map(p => p.playerId) || [];
                        
                        // Get bench players
                        const benchPlayers = players.filter(p => 
                          p.active && 
                          !unavailablePlayers.includes(p.id) && 
                          !fieldPlayerIds.includes(p.id)
                        );
                        
                        const isActive = activePosition === 'BN' && viewingInning === inningNum;
                        
                        return (
                          <Box 
                            key={inningIndex}
                            width="180px"
                            flexShrink={0}
                            mx={1}
                            height="auto"
                            minHeight="60px"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={isActive ? "blue.300" : "gray.200"}
                            bg={isActive ? "blue.50" : "white"}
                            p={1.5}
                            cursor="pointer"
                            onClick={() => {
                              setActivePosition('BN' as Position);
                              setViewingInning(inningNum);
                            }}
                            _hover={{
                              bg: isActive ? "blue.50" : "gray.50"
                            }}
                            overflowY="auto"
                          >
                            {benchPlayers.length > 0 ? (
                              <VStack spacing={1} align="stretch">
                                {benchPlayers.map(player => (
                                  <Flex 
                                    key={player.id} 
                                    alignItems="center" 
                                    fontSize="xs"
                                  >
                                    <Text
                                      fontWeight="bold"
                                      fontSize="xs"
                                      bg="gray.100"
                                      color="gray.800"
                                      borderRadius="full"
                                      px={1.5}
                                      py={0.5}
                                      minWidth="20px"
                                      textAlign="center"
                                      mr={1.5}
                                    >
                                      {player.jerseyNumber}
                                    </Text>
                                    <Text fontSize="xs" isTruncated>
                                      {player.lastName}
                                    </Text>
                                  </Flex>
                                ))}
                              </VStack>
                            ) : (
                              <Text fontSize="xs" color="gray.400" textAlign="center">
                                No players on bench
                              </Text>
                            )}
                          </Box>
                        );
                      })}
                    </Flex>
                  </Box>
                  
                  {/* Roster Panel - Right Side */}
                  <Box>
                    <Flex direction="column" height="100%">
                      <Box 
                        bg={headerBg}
                        p={2}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={borderColor}
                        mb={2}
                      >
                        <Heading size="xs">Selected Position</Heading>
                        <Text fontSize="sm" color="blue.600" fontWeight="semibold">
                          {activePosition !== 'BN' ? `${activePosition} - Inning ${viewingInning}` : `Bench - Inning ${viewingInning}`}
                        </Text>
                      </Box>
                      
                      <RosterPanel 
                        players={players.filter(p => p.active && !unavailablePlayers.includes(p.id))}
                        lineup={generatedLineup}
                        activeInning={viewingInning}
                        activePosition={activePosition}
                        onPlayerSelect={handlePlayerSelect}
                      />
                    </Flex>
                  </Box>
                </Grid>
              </Box>
            </Box>
            
            {/* Lineup Stats and Action Buttons */}
            <Flex justify="space-between" align="center" gap={3} mt={3}>
              <Button
                leftIcon={<InfoIcon />}
                colorScheme="blue"
                variant="outline"
                onClick={() => setIsStatsOpen(true)}
              >
                View Lineup Stats
              </Button>

              <Flex gap={3}>
                <Button
                  colorScheme="gray"
                  onClick={() => setGeneratedLineup(null)}
                >
                  Back to Configuration
                </Button>
                
                <Button
                  colorScheme="primary"
                  onClick={handleSaveLineup}
                >
                  Save Lineup
                </Button>
              </Flex>
            </Flex>
            
            {/* Lineup Stats Modal */}
            {isStatsOpen && (
              <Box 
                position="fixed"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="rgba(0,0,0,0.6)"
                zIndex={1000}
                onClick={() => setIsStatsOpen(false)}
              >
                <Box 
                  position="relative"
                  width={{ base: "95%", md: "80%" }}
                  maxWidth="900px"
                  maxHeight="90vh"
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  margin="5vh auto"
                  boxShadow="xl"
                  overflowY="auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Flex justify="space-between" mb={4}>
                    <Heading size="md">Lineup Statistics</Heading>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsStatsOpen(false)}
                    >
                      ✕
                    </Button>
                  </Flex>
                  
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    Playing time distribution for all players across all innings.
                  </Text>
                  
                  <Box borderWidth="1px" borderRadius="md" borderColor={borderColor} overflow="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr bg={headerBg}>
                          <Th>Player</Th>
                          <Th isNumeric>Total Innings</Th>
                          <Th isNumeric>Playing %</Th>
                          <Th isNumeric>Bench</Th>
                          <Th isNumeric>Infield</Th>
                          <Th isNumeric>Outfield</Th>
                          <Th isNumeric>P</Th>
                          <Th isNumeric>C</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {players
                          .filter(p => p.active && !unavailablePlayers.includes(p.id))
                          .sort((a, b) => a.jerseyNumber - b.jerseyNumber) // Sort by jersey number
                          .map(player => {
                            // Calculate player stats across all innings
                            const stats = calculatePlayerStats(player.id, generatedLineup);
                            
                            return (
                              <Tr key={player.id}>
                              <Td fontWeight="medium">
                                {player.jerseyNumber} - {player.lastName}, {player.firstName.charAt(0)}
                              </Td>
                              <Td isNumeric>
                                {stats.totalPlayingInnings} / {game.innings}
                              </Td>
                              <Td isNumeric>
                                <Text 
                                  color={stats.playingPercentage >= 66 ? "green.500" : 
                                         stats.playingPercentage >= 50 ? "orange.500" : "red.500"}
                                >
                                  {stats.playingPercentage}%
                                </Text>
                              </Td>
                              <Td isNumeric>{stats.benchInnings}</Td>
                              <Td isNumeric>{stats.infieldInnings}</Td>
                              <Td isNumeric>{stats.outfieldInnings}</Td>
                              <Td isNumeric>{stats.pitcherInnings}</Td>
                              <Td isNumeric>{stats.catcherInnings}</Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                  
                  <Divider my={4} />
                  
                  <Heading size="sm" mb={2}>Key Position Distribution</Heading>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    View which player is in each position per inning.
                  </Text>
                  
                  <Box display="flex" gap={4} flexWrap="wrap">
                    {['P', 'C'].map(pos => (
                      <Box key={pos} flex="1" minWidth="280px" borderWidth="1px" borderRadius="md" p={3}>
                        <Flex align="center" mb={2}>
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="white"
                            bg={
                              pos === 'P' ? 'red.500' : 'blue.500'
                            }
                            borderRadius="full"
                            px={2}
                            py={1}
                            mr={2}
                          >
                            {pos}
                          </Text>
                          <Text fontWeight="bold">{pos === 'P' ? 'Pitcher' : 'Catcher'}</Text>
                        </Flex>
                        <VStack align="stretch" spacing={1}>
                          {Array.from({ length: game.innings }).map((_, idx) => {
                            const inningNum = idx + 1;
                            const inning = generatedLineup.innings.find(i => i.inning === inningNum);
                            const assignment = inning?.positions.find(p => p.position === pos);
                            const player = assignment ? players.find(p => p.id === assignment.playerId) : null;
                            
                            return (
                              <Flex 
                                key={inningNum} 
                                justify="space-between" 
                                p={1}
                                borderBottomWidth="1px"
                                borderColor="gray.100"
                              >
                                <Text fontSize="sm">Inning {inningNum}</Text>
                                {player ? (
                                  <Text fontSize="sm" fontWeight="medium">
                                    {player.jerseyNumber} - {player.lastName}
                                  </Text>
                                ) : (
                                  <Text fontSize="sm" color="gray.400">Empty</Text>
                                )}
                              </Flex>
                            );
                          })}
                        </VStack>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
};

export default GameLineupCreator;