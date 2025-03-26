'use client';

import React, { useState } from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Heading, 
  Flex, 
  Checkbox, 
  Divider,
  Progress,
  Button,
  SimpleGrid,
  useColorModeValue
} from '@chakra-ui/react';
import { useTeamContext } from '../../contexts/team-context';
import { usePlayers } from '../../hooks/use-players';
import { useGames } from '../../hooks/use-games';

// Widget component interfaces
interface WidgetProps {
  id: string;
  component: React.ReactNode;
  enabled: boolean;
}

// Widget components that use actual data
const PlayerStatsWidget: React.FC = () => {
  // Get players data from the team context
  const { currentTeam } = useTeamContext();
  const { players, isLoading } = usePlayers();
  
  const activePlayers = players.filter(player => player.active);
  const totalPlayers = players.length;
  
  return (
    <Box 
      bg="white" 
      p={4} 
      rounded="lg" 
      shadow="sm" 
      borderWidth="1px" 
      borderColor="gray.200" 
      mb={4}
    >
      <Heading as="h3" size="sm" fontWeight="medium" color="gray.700" mb={2}>
        Player Stats
      </Heading>
      {isLoading ? (
        <Flex justify="center" py={3}>
          <Text fontSize="xs" color="gray.500">Loading...</Text>
        </Flex>
      ) : (
        <VStack spacing={2} align="stretch">
          <Flex justify="space-between" alignItems="center">
            <Text fontSize="xs" color="gray.500">Total Players</Text>
            <Text fontSize="sm" fontWeight="semibold">{totalPlayers}</Text>
          </Flex>
          <Flex justify="space-between" alignItems="center">
            <Text fontSize="xs" color="gray.500">Active Players</Text>
            <Text fontSize="sm" fontWeight="semibold">{activePlayers.length}</Text>
          </Flex>
        </VStack>
      )}
    </Box>
  );
};

const UpcomingGameWidget: React.FC = () => {
  // Get games data from context
  const { games, isLoading } = useGames();
  
  // Get the next upcoming game
  const upcomingGames = games
    .filter(game => game.date > Date.now())
    .sort((a, b) => a.date - b.date);
  
  const nextGame = upcomingGames[0];
  
  return (
    <Box 
      bg="white" 
      p={4} 
      rounded="lg" 
      shadow="sm" 
      borderWidth="1px" 
      borderColor="gray.200" 
      mb={4}
    >
      <Heading as="h3" size="sm" fontWeight="medium" color="gray.700" mb={2}>
        Next Game
      </Heading>
      {isLoading ? (
        <Flex justify="center" py={3}>
          <Text fontSize="xs" color="gray.500">Loading...</Text>
        </Flex>
      ) : nextGame ? (
        <Box fontSize="xs">
          <Text fontWeight="medium">vs. {nextGame.opponent}</Text>
          <Text color="gray.500">
            {new Date(nextGame.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })} at {new Date(nextGame.date).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </Text>
          <Text color="gray.500">{nextGame.location}</Text>
        </Box>
      ) : (
        <Text fontSize="xs" color="gray.500">No upcoming games</Text>
      )}
    </Box>
  );
};

const FairPlayWidget: React.FC = () => {
  // Get the current team
  const { currentTeam } = useTeamContext();
  const { players } = usePlayers();
  const { games } = useGames();
  
  // This would ideally use real fair play metrics
  // For now we'll just show placeholder metrics - in a real app, use positionHistoryStorage data
  return (
    <Box 
      bg="white" 
      p={4} 
      rounded="lg" 
      shadow="sm" 
      borderWidth="1px" 
      borderColor="gray.200" 
      mb={4}
    >
      <Heading as="h3" size="sm" fontWeight="medium" color="gray.700" mb={2}>
        Fair Play Metrics
      </Heading>
      {!currentTeam || players.length === 0 ? (
        <Text fontSize="xs" color="gray.500">
          Add players to see fair play metrics
        </Text>
      ) : games.length === 0 ? (
        <Text fontSize="xs" color="gray.500">
          Add games with lineups to see fair play metrics
        </Text>
      ) : (
        <VStack spacing={2} align="stretch">
          <Box>
            <Flex justify="space-between" fontSize="xs">
              <Text color="gray.500">Overall</Text>
              <Text>85%</Text>
            </Flex>
            <Progress value={85} size="xs" colorScheme="primary" rounded="full" mt={1} />
          </Box>
          <Box>
            <Flex justify="space-between" fontSize="xs">
              <Text color="gray.500">Playing Time</Text>
              <Text>92%</Text>
            </Flex>
            <Progress value={92} size="xs" colorScheme="green" rounded="full" mt={1} />
          </Box>
        </VStack>
      )}
    </Box>
  );
};

const WidgetsSidebar: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetProps[]>([
    { id: 'player-stats', component: <PlayerStatsWidget />, enabled: true },
    { id: 'upcoming-game', component: <UpcomingGameWidget />, enabled: true },
    { id: 'fair-play', component: <FairPlayWidget />, enabled: true },
  ]);

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map(widget => 
      widget.id === id ? {...widget, enabled: !widget.enabled} : widget
    ));
  };

  const formatWidgetName = (id: string): string => {
    return id.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Box h="full" p={4} overflowY="auto">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h2" size="sm" fontWeight="medium" color="gray.700">
          Widgets
        </Heading>
        <Button size="xs" colorScheme="primary" variant="link">
          Customize
        </Button>
      </Flex>
      
      {/* Render enabled widgets */}
      {widgets.filter(w => w.enabled).map(widget => (
        <React.Fragment key={widget.id}>
          {widget.component}
        </React.Fragment>
      ))}
      
      {/* Widget management section */}
      <Divider my={6} borderColor="gray.200" />
      
      <Box>
        <Heading as="h3" size="xs" fontWeight="medium" color="gray.500" mb={2}>
          Manage Widgets
        </Heading>
        <VStack spacing={1} align="stretch">
          {widgets.map(widget => (
            <Flex key={widget.id} align="center" py={1}>
              <Checkbox
                id={`widget-${widget.id}`}
                isChecked={widget.enabled}
                onChange={() => toggleWidget(widget.id)}
                colorScheme="primary"
                size="sm"
              />
              <Text 
                as="label" 
                htmlFor={`widget-${widget.id}`} 
                fontSize="xs" 
                color="gray.600" 
                ml={2}
                cursor="pointer"
              >
                {formatWidgetName(widget.id)}
              </Text>
            </Flex>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

export default WidgetsSidebar;