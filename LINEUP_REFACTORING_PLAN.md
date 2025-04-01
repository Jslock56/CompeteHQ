# Lineup System Refactoring Plan

## Current Issues

1. The system mixes two conceptually different lineup types:
   - Template/Default lineups (single-inning, reusable)
   - Game-specific lineups (multi-inning, tied to games)

2. Components and hooks don't clearly distinguish between the two types

3. The data storage approach is inconsistent with some game lineups stored in the main lineup collection

## Phase 1: Clear Documentation and TypeScript Types (Immediate)

- [x] Create clear documentation distinguishing the two lineup types
- [ ] Update TypeScript types to clearly separate the two concepts:

```typescript
// In src/types/lineup.ts
export interface BaseLineup {
  id: string;
  teamId: string;
  name?: string;
  type?: 'standard' | 'competitive' | 'developmental';
  createdAt: number;
  updatedAt: number;
}

export interface TemplateLineup extends BaseLineup {
  isDefault?: boolean;
  positions: PositionAssignment[];  // Single inning representation
}

export interface GameLineup extends BaseLineup {
  gameId: string;
  innings: LineupInning[];  // Multi-inning representation
  collectionType: 'gameLineups';
}

// Update existing Lineup type to be a union for backward compatibility
export type Lineup = TemplateLineup | GameLineup;

// Helper functions to distinguish types
export const isGameLineup = (lineup: Lineup): lineup is GameLineup => {
  return 'gameId' in lineup && 'innings' in lineup;
};

export const isTemplateLineup = (lineup: Lineup): lineup is TemplateLineup => {
  return !('gameId' in lineup) && 'positions' in lineup;
};
```

## Phase 2: Component Reorganization (Near Term)

1. Create new directory structure:
```
src/
  components/
    lineup/
      templates/    # Template/default lineup components
      games/        # Game-specific lineup components
      common/       # Shared components
```

2. Move components to their proper locations:
   - Move game-lineup-creator.tsx to components/lineup/games/
   - Move field-position-lineup-builder.tsx to components/lineup/templates/
   - Identify shared components and move to components/lineup/common/

3. Update imports across the codebase

## Phase 3: API and Storage Refactoring (Medium Term)

1. Create clear API endpoints:
   - Use `/api/lineups/templates/` for template lineups
   - Use `/api/games/[id]/lineup/` exclusively for game lineups

2. Update database adapters:
   - Ensure template lineups use the 'lineups' collection
   - Ensure game lineups use the 'gameLineups' collection
   - Add data migration script for any incorrectly stored lineups

3. Update the `useLineup` hook to have two separate implementations:
   - `useTemplateLineup` for template/default lineups
   - `useGameLineup` for game-specific lineups

## Phase 4: UI Updates (Longer Term)

1. Update routes and pages:
   - `/lineup/*` routes for template lineups
   - `/games/[id]/lineup/*` routes for game lineups

2. Ensure UI elements clearly indicate which type of lineup is being managed

3. Add clear navigation paths between the two systems

## Implementation Priority

1. Documentation and TypeScript types (high priority)
2. Component reorganization (high priority)
3. Hook separation (medium priority)
4. API endpoint updates (medium priority)
5. Storage refactoring (medium priority)
6. UI updates (lower priority)

## Backward Compatibility

During the transition:
1. Maintain the unified `Lineup` type as a union
2. Add type guards for distinguishing between lineup types
3. Keep legacy endpoints working until migration is complete
4. Add temporary fallback logic to check both collections when loading lineups

## Testing Strategy

1. Create test cases for both lineup types
2. Ensure existing tests continue to pass during refactoring
3. Add explicit tests for the type guards and helper functions
4. Test the migration of lineups from one collection to another

## Success Metrics

1. Developers can easily distinguish between lineup types
2. No bugs or confusion reported related to lineup types
3. Components clearly belong to one system or the other
4. All lineups stored in their appropriate collections
5. Type safety and proper validation at all levels