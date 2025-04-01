import { Lineup, LineupInning, PositionAssignment } from '../types/lineup';
import { Player, Position } from '../types/player';
import { generateGameLineup as generateGameLineupImpl } from './game-lineup-generator';
import { GameLineupGeneratorOptions } from './game-lineup-generator';

export interface ValidationResult {
  valid: boolean;
  message?: string;
  affectedPlayers?: string[];
  affectedInnings?: number[];
  severity: 'error' | 'warning';
}

/**
 * Generate a game-specific lineup with fair play rules applied
 * (This is a re-export of the implementation in game-lineup-generator.ts)
 */
export const generateGameLineup = generateGameLineupImpl;

/**
 * Checks if all positions in an inning have players assigned
 */
export const isInningComplete = (inning: LineupInning): boolean => {
  // Make sure every position has a player assigned
  return inning.positions.every(pos => pos.playerId);
};

/**
 * Checks if a position is filled in an inning
 */
export const isPositionFilled = (inning: LineupInning, position: Position): boolean => {
  return inning.positions.some(pos => pos.position === position && pos.playerId);
};

/**
 * Gets all assigned player IDs in an inning
 */
export const getAssignedPlayerIds = (inning: LineupInning): string[] => {
  return inning.positions
    .filter(pos => pos.playerId)
    .map(pos => pos.playerId);
};

/**
 * Checks if a player is already assigned in an inning
 */
export const isPlayerAssignedInInning = (inning: LineupInning, playerId: string): boolean => {
  return inning.positions.some(pos => pos.playerId === playerId);
};

/**
 * Get position assignment for a player in an inning
 */
export const getPlayerPositionInInning = (inning: LineupInning, playerId: string): Position | null => {
  const assignment = inning.positions.find(pos => pos.playerId === playerId);
  return assignment ? assignment.position : null;
};

/**
 * Gets all innings where a player is on the bench
 */
export const getBenchedInnings = (lineup: Lineup, playerId: string): number[] => {
  return lineup.innings
    .filter(inning => !getAssignedPlayerIds(inning).includes(playerId))
    .map(inning => inning.inning);
};

/**
 * Gets the maximum consecutive bench innings for a player
 */
export const getConsecutiveBenchInnings = (lineup: Lineup, playerId: string): number => {
  const benchedInnings = getBenchedInnings(lineup, playerId);
  
  if (benchedInnings.length <= 1) return benchedInnings.length;
  
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  
  for (let i = 1; i < benchedInnings.length; i++) {
    if (benchedInnings[i] === benchedInnings[i-1] + 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }
  
  return maxConsecutive;
};

/**
 * Gets all positions played by a player in a lineup
 */
export const getPositionsPlayed = (lineup: Lineup, playerId: string): Position[] => {
  const positions = new Set<Position>();
  
  lineup.innings.forEach(inning => {
    const position = getPlayerPositionInInning(inning, playerId);
    if (position) positions.add(position);
  });
  
  return Array.from(positions);
};

/**
 * Gets the number of innings a player has played at a specific position
 */
export const getInningsAtPosition = (lineup: Lineup, playerId: string, position: Position): number => {
  return lineup.innings.filter(inning => {
    return inning.positions.some(pos => pos.position === position && pos.playerId === playerId);
  }).length;
};

/**
 * Checks if a position is an infield position
 */
export const isInfieldPosition = (position: Position): boolean => {
  return ['P', 'C', '1B', '2B', '3B', 'SS'].includes(position);
};

/**
 * Checks if a position is an outfield position
 */
export const isOutfieldPosition = (position: Position): boolean => {
  return ['LF', 'CF', 'RF'].includes(position);
};

/**
 * Calculate the percentage of innings a player has played infield positions
 */
export const getInfieldPercentage = (lineup: Lineup, playerId: string): number => {
  const totalInningsPlayed = lineup.innings.filter(inning => 
    inning.positions.some(pos => pos.playerId === playerId)
  ).length;
  
  if (totalInningsPlayed === 0) return 0;
  
  const infieldInnings = lineup.innings.filter(inning => 
    inning.positions.some(pos => 
      pos.playerId === playerId && isInfieldPosition(pos.position)
    )
  ).length;
  
  return (infieldInnings / totalInningsPlayed) * 100;
};

/**
 * Create a default inning with empty positions
 */
export const createDefaultInning = (inningNumber: number): LineupInning => {
  // Define the standard positions in a baseball lineup
  const standardPositions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  
  return {
    inning: inningNumber,
    positions: standardPositions.map(position => ({
      position,
      playerId: '',
    })),
  };
};

/**
 * Create a default lineup structure with a specified number of innings
 */
export const createDefaultLineup = (
  teamId: string,
  gameId?: string,
  inningCount: number = 6,
  name?: string,
  type?: 'competitive' | 'developmental'
): Lineup => {
  const now = Date.now();
  
  return {
    id: '', // Will be assigned when saved
    teamId,
    gameId,
    name,
    type,
    innings: Array.from({ length: inningCount }, (_, i) => createDefaultInning(i + 1)),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    isDefault: false,
  };
};

/**
 * Create a defensive field-position lineup (non-game specific)
 */
export const createFieldPositionLineup = (
  teamId: string,
  name: string,
  type: 'standard' | 'competitive' | 'developmental' = 'standard'
): Lineup => {
  const now = Date.now();
  
  // For field position lineup, we use just a single "inning"
  return {
    id: '', // Will be assigned when saved
    teamId,
    name,
    type,
    innings: [createDefaultInning(1)],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    isDefault: false,
  };
};

/**
 * Check if a player has been benched for two or more consecutive innings
 * Returns a ValidationResult
 */
export const checkConsecutiveBench = (lineup: Lineup, playerIds: string[]): ValidationResult => {
  const playersWithIssues: string[] = [];
  const affectedInnings: number[] = [];
  
  playerIds.forEach(playerId => {
    const consecutive = getConsecutiveBenchInnings(lineup, playerId);
    if (consecutive >= 2) {
      playersWithIssues.push(playerId);
      
      // Add all benched innings for this player
      const benched = getBenchedInnings(lineup, playerId);
      benched.forEach(inning => {
        if (!affectedInnings.includes(inning)) {
          affectedInnings.push(inning);
        }
      });
    }
  });
  
  const valid = playersWithIssues.length === 0;
  
  return {
    valid,
    message: valid ? undefined : 'Some players are benched for 2+ consecutive innings',
    affectedPlayers: playersWithIssues.length > 0 ? playersWithIssues : undefined,
    affectedInnings: affectedInnings.length > 0 ? affectedInnings : undefined,
    severity: 'warning',
  };
};

/**
 * Check if a player hasn't played any infield positions
 * Returns a ValidationResult
 */
export const checkInfieldExperience = (lineup: Lineup, playerIds: string[]): ValidationResult => {
  // Only apply to lineups with at least 3 innings
  if (lineup.innings.length < 3) {
    return { valid: true, severity: 'warning' };
  }
  
  const playersWithIssues: string[] = [];
  
  playerIds.forEach(playerId => {
    const positions = getPositionsPlayed(lineup, playerId);
    const hasInfield = positions.some(pos => isInfieldPosition(pos));
    
    if (!hasInfield) {
      playersWithIssues.push(playerId);
    }
  });
  
  const valid = playersWithIssues.length === 0;
  
  return {
    valid,
    message: valid ? undefined : 'Some players haven\'t played any infield positions',
    affectedPlayers: playersWithIssues.length > 0 ? playersWithIssues : undefined,
    severity: 'warning',
  };
};

/**
 * Validate all positions are filled
 * Returns a ValidationResult
 */
export const validatePositionsFilled = (lineup: Lineup): ValidationResult => {
  const incompleteInnings = lineup.innings
    .filter(inning => !isInningComplete(inning))
    .map(inning => inning.inning);
  
  const valid = incompleteInnings.length === 0;
  
  return {
    valid,
    message: valid ? undefined : 'Some positions are not filled',
    affectedInnings: incompleteInnings.length > 0 ? incompleteInnings : undefined,
    severity: 'error',
  };
};

/**
 * Get all validation results for a lineup
 */
export const validateLineup = (lineup: Lineup, playerIds: string[]): ValidationResult[] => {
  return [
    validatePositionsFilled(lineup),
    checkConsecutiveBench(lineup, playerIds),
    checkInfieldExperience(lineup, playerIds),
  ];
};

/**
 * Get player information for lineup display
 */
export const getPlayerName = (player: Player): string => {
  return `${player.firstName} ${player.lastName} (#${player.jerseyNumber})`;
};

/**
 * Determine if a position is primary, secondary, or new for a player
 */
export const getPositionTypeForPlayer = (player: Player, position: Position): 'primary' | 'secondary' | 'new' => {
  if (player.primaryPositions.includes(position)) {
    return 'primary';
  } else if (player.secondaryPositions.includes(position)) {
    return 'secondary';
  } else {
    return 'new';
  }
};

/**
 * Get fair play issues for a lineup as string messages
 * 
 * @param lineup - The lineup to check
 * @param players - The team's player roster
 * @returns Array of issues found as string messages
 */
export const getFairPlayIssues = (lineup: Lineup, players: Player[]): string[] => {
  const issues: string[] = [];
  const playerIds = players.filter(p => p.active).map(p => p.id);
  
  // Get all validation results
  const validationResults = validateLineup(lineup, playerIds);
  
  // Convert validation results to user-friendly messages
  validationResults.forEach(result => {
    if (!result.valid && result.message) {
      if (result.affectedPlayers && result.affectedPlayers.length > 0) {
        // Add details for each affected player
        result.affectedPlayers.forEach(playerId => {
          const player = players.find(p => p.id === playerId);
          if (player) {
            issues.push(`${result.message}: ${getPlayerName(player)}`);
          }
        });
      } else {
        // Add the general message
        issues.push(result.message);
      }
    }
  });
  
  // Additional check: playing time balance
  const totalInnings = lineup.innings.length;
  if (totalInnings >= 3) {
    const minInningsExpected = Math.floor(totalInnings / 2);
    
    // Check each player's innings
    playerIds.forEach(playerId => {
      const player = players.find(p => p.id === playerId);
      if (!player || !player.active) return;
      
      const benchedInnings = getBenchedInnings(lineup, playerId);
      const inningsPlayed = totalInnings - benchedInnings.length;
      
      // Player getting too few innings
      if (inningsPlayed < minInningsExpected) {
        issues.push(`${getPlayerName(player)} only plays ${inningsPlayed} of ${totalInnings} innings.`);
      }
      
      // Player playing all innings when others sit out
      if (inningsPlayed === totalInnings && players.filter(p => p.active).length > 10) {
        issues.push(`${getPlayerName(player)} plays all ${totalInnings} innings while other players sit out.`);
      }
    });
    
    // Check for position variety
    playerIds.forEach(playerId => {
      const player = players.find(p => p.id === playerId);
      if (!player || !player.active) return;
      
      const positionsPlayed = getPositionsPlayed(lineup, playerId);
      const benchedInnings = getBenchedInnings(lineup, playerId);
      const inningsPlayed = totalInnings - benchedInnings.length;
      
      // If player plays multiple innings but only one position
      if (positionsPlayed.length === 1 && inningsPlayed > 1) {
        issues.push(`${getPlayerName(player)} plays only ${positionsPlayed[0]} for all ${inningsPlayed} innings.`);
      }
    });
  }
  
  return issues;
};