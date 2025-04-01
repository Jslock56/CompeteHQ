/**
 * Shared types used across multiple modules
 */

/**
 * Available baseball positions
 */
export type Position = 
  | 'P'  // Pitcher
  | 'C'  // Catcher
  | '1B' // First Base
  | '2B' // Second Base
  | '3B' // Third Base
  | 'SS' // Shortstop
  | 'LF' // Left Field
  | 'CF' // Center Field
  | 'RF' // Right Field
  | 'DH' // Designated Hitter
  | 'BN'; // Bench