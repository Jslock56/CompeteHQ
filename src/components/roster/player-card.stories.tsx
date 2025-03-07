import type { Meta, StoryObj } from '@storybook/react';
import { Box, ChakraProvider, VStack } from '@chakra-ui/react';
import { PlayerCard } from './player-card';
import { Player, Position } from '../../types/player';
import { theme } from '../../theme'; // Import your Chakra theme

// Define the metadata for the component
const meta: Meta<typeof PlayerCard> = {
  component: PlayerCard,
  title: 'Components/Roster/PlayerCard',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onDelete: { action: 'deleted' },
    onToggleActive: { action: 'active status toggled' }
  },
  // Wrap the component in ChakraProvider to ensure Chakra styles are applied
  decorators: [
    (Story) => (
      <ChakraProvider theme={theme}>
        <Box maxW="100%" w="100%" p={4}>
          <Story />
        </Box>
      </ChakraProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlayerCard>;

// Create a sample player for our stories
const samplePlayer: Player = {
  id: '1',
  teamId: 'team1',
  firstName: 'John',
  lastName: 'Smith',
  jerseyNumber: 24,
  primaryPositions: ['P', 'SS'] as Position[],
  secondaryPositions: ['2B', '3B'] as Position[],
  active: true,
  notes: 'Strong arm, good hitter. Left-handed with exceptional control. Has been playing since age 5.',
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// Create a sample inactive player
const inactivePlayer: Player = {
  ...samplePlayer,
  id: '2',
  firstName: 'Michael',
  lastName: 'Johnson',
  jerseyNumber: 42,
  active: false,
  notes: 'Currently injured, expected back in 2 weeks. Sprained ankle during practice on Tuesday.'
};

// Create a player with lots of positions
const versatilePlayer: Player = {
  ...samplePlayer,
  id: '3',
  firstName: 'David',
  lastName: 'Wilson',
  jerseyNumber: 7,
  primaryPositions: ['P', 'C', '1B', 'SS'] as Position[],
  secondaryPositions: ['2B', '3B', 'LF', 'CF', 'RF'] as Position[],
  notes: 'Can play any position. Has experience at every position on the field. Excellent baseball IQ.'
};

// Player with long name
const longNamePlayer: Player = {
  ...samplePlayer,
  id: '4',
  firstName: 'Christopher Alexander',
  lastName: 'Johnson-Williams',
  jerseyNumber: 15,
  primaryPositions: ['CF'] as Position[],
  secondaryPositions: ['LF', 'RF'] as Position[],
  notes: 'Player with a very long name to test layout responsiveness.'
};

// Player with no notes
const noNotesPlayer: Player = {
  ...samplePlayer,
  id: '5',
  firstName: 'Robert',
  lastName: 'Davis',
  jerseyNumber: 33,
  notes: ''
};

// Default story with a standard active player
export const Default: Story = {
  args: {
    player: samplePlayer
  },
};

// Story showing an inactive player
export const Inactive: Story = {
  args: {
    player: inactivePlayer
  },
};

// Story showing a player who can play many positions
export const Versatile: Story = {
  args: {
    player: versatilePlayer
  },
};

// Story showing a player with a very long name
export const LongName: Story = {
  args: {
    player: longNamePlayer
  },
};

// Story showing a player with no notes
export const NoNotes: Story = {
  args: {
    player: noNotesPlayer
  },
};

// Multiple players in a list
export const PlayerList: Story = {
  render: () => (
    <VStack spacing={4} align="stretch" width="100%">
      <PlayerCard player={samplePlayer} />
      <PlayerCard player={inactivePlayer} />
      <PlayerCard player={versatilePlayer} />
      <PlayerCard player={longNamePlayer} />
    </VStack>
  ),
};

// Story with event handlers
export const WithHandlers: Story = {
  args: {
    player: samplePlayer,
    onDelete: (id) => console.log(`Delete player: ${id}`),
    onToggleActive: (id) => console.log(`Toggle active status for player: ${id}`)
  },
};