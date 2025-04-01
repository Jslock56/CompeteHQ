# Lineup System Architecture

## Overview

The CompeteHQ lineup system is organized to handle two distinct types of lineups:

1. **Template Lineups** - Single-inning, reusable lineup templates that coaches can create and save for future use
2. **Game Lineups** - Multi-inning, game-specific lineups that are tied to a particular game

## Directory Structure

The lineup components are organized as follows:

```
src/
  components/
    lineup/
      common/     # Shared components used by both lineup types
      templates/  # Components for template lineups
      games/      # Components for game-specific lineups
      index.ts    # Central export for all lineup components
```

## Component Types

### Template Lineup Components
- `TemplateLineupBuilder` - Main component for creating/editing template lineups
- Uses the `useTemplateLineup` hook for state management
- Stored as single-inning position assignments

### Game Lineup Components
- `GameLineupBuilder` - Main component for creating/editing game lineups
- Uses the `useGameLineup` hook for state management
- Stored as multiple inning-by-inning position assignments
- Can be initialized from a template lineup

### Common Components
- `FairPlayChecker` - Component for validating lineup fairness
- `RosterPanel` - Component for displaying and selecting players
- Other reusable UI elements shared between lineup types

## Usage

```tsx
// Import the components from the central export
import { 
  GameLineupBuilder, 
  TemplateLineupBuilder 
} from '../components/lineup';

// For template lineups
<TemplateLineupBuilder 
  teamId={teamId}
  players={players}
  onSave={handleSave}
/>

// For game lineups
<GameLineupBuilder
  game={game}
  players={players} 
  onSave={handleSave}
/>
```

## Hooks

The lineup system uses specialized hooks for each lineup type:

- `useTemplateLineup` - Hook for template lineup state management
- `useGameLineup` - Hook for game lineup state management
- `useLineup` - Legacy hook that handles both types (for backward compatibility)

## Database Storage

Template lineups and game lineups are stored in separate collections:
- Template lineups: in the 'lineups' collection
- Game lineups: in the 'gameLineups' collection

## TypeScript Types

The lineup system uses TypeScript types to clearly distinguish between lineup types:

```typescript
// Base shared properties
interface BaseLineup { /*...*/ }

// Template lineup type
interface TemplateLineup extends BaseLineup { 
  positions: PositionAssignment[];
  // ...
}

// Game lineup type
interface GameLineup extends BaseLineup {
  gameId: string;
  innings: LineupInning[];
  // ...
}

// Union type for backward compatibility
type Lineup = TemplateLineup | GameLineup;

// Type guards
function isGameLineup(lineup: Lineup): lineup is GameLineup { /*...*/ }
function isTemplateLineup(lineup: Lineup): lineup is TemplateLineup { /*...*/ }
```