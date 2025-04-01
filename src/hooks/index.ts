/**
 * Hooks index
 * Central export for all custom hooks
 */

// Team hooks
export { default as useTeam } from './use-team';

// Player hooks
export { default as usePlayers } from './use-players';

// Game hooks 
export { default as useGames } from './use-games';

// Lineup hooks
export { default as useLineup } from './use-lineup';
export { default as useGameLineup } from './use-game-lineup';
export { default as useTemplateLineup } from './use-template-lineup';

// Position tracking hooks
export { default as usePositionTracking } from './use-position-tracking';

// Storage hooks
export { default as useStorage } from './use-storage';
export { default as useLocalStorage } from './use-local-storage';