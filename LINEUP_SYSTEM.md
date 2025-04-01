# CompeteHQ Lineup System

## Problem Statement

The CompeteHQ lineup system mixes two conceptually different lineup types that serve different purposes:

1. **Template Lineups** 
   - Single-inning, reusable lineup templates
   - Can be saved as defaults for future use
   - Used as starting points for game lineups

2. **Game Lineups**
   - Multi-inning, game-specific lineups 
   - Track position changes across innings
   - Support fair play rules and substitution patterns
   - Tied to specific games

This has led to several issues:
- Confusing code organization with mixed concerns
- Unclear type definitions for different lineup concepts
- Components that don't clearly distinguish between the types
- Inconsistent data storage with some game lineups in the main lineup collection

## Refactoring Plan & Progress

### Phase 1: ✅ Type System Improvements

1. **Fixed Position Type Redundancy**
   - Created `/src/types/shared-types.ts` with unified Position type definition
   - Updated `lineup.ts` and `player.ts` to import from shared location
   - Preserved documentation comments for position codes

2. **Implemented Lineup Type Separation**
   - Created distinct interfaces for different lineup types:
   ```typescript
   // Base shared properties
   interface BaseLineup {
     id: string;
     teamId: string;
     name?: string;
     type?: 'standard' | 'competitive' | 'developmental';
     status: 'draft' | 'final';
     createdAt: number;
     updatedAt: number;
   }
   
   // Template lineup (single-inning)
   interface TemplateLineup extends BaseLineup { 
     isDefault?: boolean;
     positions: PositionAssignment[];  // Single inning representation
   }
   
   // Game lineup (multi-inning)
   interface GameLineup extends BaseLineup {
     gameId: string;
     innings: LineupInning[];  // Multi-inning representation
     collectionType?: 'gameLineups';
   }
   
   // Union type for backward compatibility
   type Lineup = TemplateLineup | GameLineup;
   
   // Type guards
   const isGameLineup = (lineup: Lineup): lineup is GameLineup => {
     return 'gameId' in lineup && 'innings' in lineup;
   };
   
   const isTemplateLineup = (lineup: Lineup): lineup is TemplateLineup => {
     return !('gameId' in lineup) && 'positions' in lineup;
   };
   ```

### Phase 2: ✅ Component Reorganization

1. **Created Logical Directory Structure**
   ```
   src/
     components/
       lineup/
         templates/  # Template lineup components
         games/      # Game-specific lineup components
         common/     # Shared components
         index.ts    # Central export for all lineup components
   ```

2. **Moved Components to Proper Locations**
   - Template lineup builder → templates/ directory
   - Game lineup builder → games/ directory
   - Fair play checker → common/ directory
   - Created index exports for proper importing

3. **Created Specialized Hooks**
   - `useTemplateLineup` - Hook for template lineup management
   - `useGameLineup` - Hook for game lineup management
   - Maintained original `useLineup` for backward compatibility

### Phase 3: ⏳ API and Storage Refactoring (In Progress)

1. **API Structure Updates**
   - Create dedicated API endpoints for each lineup type:
     - `/api/lineups/templates/` for template lineups
     - `/api/games/[id]/lineup/` exclusively for game lineups

2. **Database Separation**
   - Ensure template lineups use the 'lineups' collection
   - Ensure game lineups use the 'gameLineups' collection
   - Add data migration script for any incorrectly stored lineups

### Phase 4: ⏳ UI Updates (Planned)

1. **Update Routes and Pages**
   - `/lineup/*` routes for template lineups
   - `/games/[id]/lineup/*` routes for game lineups

2. **Improve UI Clarity**
   - Ensure UI elements clearly indicate which type of lineup is being managed
   - Add clear navigation paths between the two systems

## Component Architecture

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

## Usage Examples

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

## Implementation Strategy

### Backward Compatibility
During the transition:
1. Maintain the unified `Lineup` type as a union
2. Keep legacy endpoints working until migration is complete
3. Add temporary fallback logic to check both collections when loading lineups

### Testing Strategy
1. Create test cases for both lineup types
2. Ensure existing tests continue to pass during refactoring
3. Add explicit tests for the type guards and helper functions
4. Test the migration of lineups from one collection to another

## Benefits of This Refactoring

This refactoring provides a clearer separation of concerns which improves:

1. **Type Safety** - Proper TypeScript types and guards make the code more robust
2. **Code Organization** - Components logically grouped by purpose
3. **Developer Experience** - Specialized hooks for each lineup type
4. **Maintainability** - Clearer boundaries between concepts
5. **Future Extensibility** - Each lineup type can evolve independently

## Success Metrics

1. Developers can easily distinguish between lineup types
2. No bugs or confusion reported related to lineup types
3. Components clearly belong to one system or the other
4. All lineups stored in their appropriate collections
5. Type safety and proper validation at all levels