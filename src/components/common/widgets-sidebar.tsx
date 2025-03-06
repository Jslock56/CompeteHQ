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

// Widget component interfaces
interface WidgetProps {
  id: string;
  component: React.ReactNode;
  enabled: boolean;
}

// Sample widget components
const PlayerStatsWidget: React.FC = () => (
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
    <VStack spacing={2} align="stretch">
      <Flex justify="space-between" alignItems="center">
        <Text fontSize="xs" color="gray.500">Total Players</Text>
        <Text fontSize="sm" fontWeight="semibold">14</Text>
      </Flex>
      <Flex justify="space-between" alignItems="center">
        <Text fontSize="xs" color="gray.500">Active Players</Text>
        <Text fontSize="sm" fontWeight="semibold">12</Text>
      </Flex>
    </VStack>
  </Box>
);

const UpcomingGameWidget: React.FC = () => (
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
    <Box fontSize="xs">
      <Text fontWeight="medium">vs. Eagles</Text>
      <Text color="gray.500">Saturday, Mar 15 at 3:00 PM</Text>
      <Text color="gray.500">Home Field</Text>
    </Box>
  </Box>
);

const FairPlayWidget: React.FC = () => (
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
  </Box>
);

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