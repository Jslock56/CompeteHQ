# Lineup Types and Components Documentation

## Overview

This document clarifies the distinction between the two separate lineup systems in CompeteHQ:

1. **Standard/Template Lineups** - Used for creating default lineups that can be saved and reused throughout the season
2. **Game-Specific Lineups** - Used for managing player positions for a specific game with multi-inning support

## Lineup Types

### 1. Standard/Template Lineups

- **Purpose**: Create reusable lineup templates that can serve as starting points for games
- **Characteristics**:
  - Single inning representation
  - Can be saved as a template for future use
  - Can be marked as default lineup for a team
  - Typically created and managed from `/lineup/` routes
  - Does NOT have a `gameId` reference
  - Uses the `lineups` collection in MongoDB

### 2. Game-Specific Lineups

- **Purpose**: Create game-day lineups with inning-by-inning player assignments
- **Characteristics**:
  - Multi-inning representation
  - Includes fair play rules
  - Directly associated with a specific game
  - Has a `gameId` reference and the game has a `lineupId` reference
  - Typically created and managed from `/games/[id]/lineup/` routes
  - Uses the `gameLineups` collection in MongoDB

## Component Organization

To maintain a clear separation between the two lineup systems, adhere to the following guidelines:

### File and Directory Structure

```
src/
  components/
    lineup/
      templates/           # Components for standard/template lineups
        template-lineup-builder.tsx
        template-selector.tsx
        ...
      games/               # Components for game-specific lineups
        game-lineup-creator.tsx
        game-lineup-editor.tsx
        ...
      common/              # Shared components used by both systems
        position-badge.tsx
        player-selector.tsx
        ...
  app/
    lineup/                # Routes for standard/template lineups
      ...
    games/
      [id]/
        lineup/            # Routes for game-specific lineups
          ...
```

### API Endpoints

- Template/standard lineups: `/api/lineups/` or `/api/teams/[id]/lineups/`
- Game-specific lineups: `/api/games/[id]/lineup/`

### Data Storage

- Template lineups should explicitly use the `lineups` collection
- Game lineups should explicitly use the `gameLineups` collection
- When creating a game lineup, always add the `collectionType: 'gameLineups'` property

## Component Usage Guidelines

### Creating New Components

When creating new lineup-related components:

1. Determine which lineup system the component belongs to
2. Place it in the appropriate directory
3. Add clear JSDoc comments indicating which lineup system it's for
4. Include the lineup type in the component name (e.g., `GameLineupEditor` vs `TemplateLineupEditor`)

### Importing Components

When importing lineup components:

```javascript
// For game-specific lineups
import GameLineupCreator from 'components/lineup/games/game-lineup-creator';

// For template lineups
import TemplateLineupBuilder from 'components/lineup/templates/template-lineup-builder';

// For shared components
import PositionBadge from 'components/lineup/common/position-badge';
```

## Database Schema

### Template Lineup

```typescript
interface TemplateLineup {
  id: string;
  teamId: string;
  name: string;
  type: 'standard' | 'competitive' | 'developmental';
  isDefault?: boolean;
  positions: PositionAssignment[];  // Single inning
  createdAt: number;
  updatedAt: number;
}
```

### Game Lineup

```typescript
interface GameLineup {
  id: string;
  gameId: string;
  teamId: string;
  name?: string;
  type?: 'standard' | 'competitive' | 'developmental';
  innings: LineupInning[]; // Multiple innings
  collectionType: 'gameLineups';
  createdAt: number;
  updatedAt: number;
}
```

## Migration Plan

1. Create new directories for template and game lineup components
2. Gradually move components to their appropriate locations
3. Update imports in all files
4. Use explicit collection types when saving to the database
5. Maintain backward compatibility until migration is complete

By following these guidelines, we can maintain a clear separation between the two lineup systems and avoid confusion in the codebase.