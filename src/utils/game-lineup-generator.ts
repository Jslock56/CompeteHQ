import { v4 as uuidv4 } from 'uuid';
import { Lineup, LineupInning, Position, PositionAssignment } from '../types/lineup';
import { Player } from '../types/player';
import { 
  createDefaultLineup, 
  isInfieldPosition, 
  isOutfieldPosition, 
  getPlayerPositionInInning 
} from './lineup-utils';

/**
 * Settings for fair play rules
 */
export interface FairPlaySettings {
  // No player sits out two innings in a row
  noConsecutiveBench: boolean;
  
  // No player sits twice until everyone sits once
  noDoubleBeforeAll: boolean;
  
  // No player starts on bench in consecutive games
  noConsecutiveGameBench: boolean;
  
  // Each player gets at least one infield inning
  atLeastOneInfield: boolean;
}

/**
 * Options for generating a game lineup
 */
export interface GameLineupGeneratorOptions {
  // Game ID to associate with the lineup
  gameId: string;
  
  // Team ID
  teamId: string;
  
  // Number of innings in the game
  innings: number;
  
  // Available players for the game
  players: Player[];
  
  // Template lineup to use as starting point (optional)
  templateLineup?: Lineup | null;
  
  // Lineup type (standard, competitive, developmental)
  lineupType: 'standard' | 'competitive' | 'developmental';
  
  // Fair play settings (if null, fair play is disabled)
  fairPlaySettings: FairPlaySettings | null;
  
  // Previously benched players in the last game's first inning (optional)
  previouslyBenchedPlayers?: string[];
  
  // Position history across multiple games (for premium users)
  positionHistory?: Record<string, Position[]>;
  
  // Prioritize position continuity (minimize changes between innings)
  prioritizeContinuity?: boolean;
}

/**
 * Generate a game-specific lineup with fair play rules applied
 */
export function generateGameLineup(options: GameLineupGeneratorOptions): Lineup {
  const {
    gameId,
    teamId,
    innings,
    players,
    templateLineup,
    lineupType,
    fairPlaySettings,
    positionHistory,
    prioritizeContinuity = true // Default to true for better user experience
  } = options;
  
  // Create base lineup structure 
  const lineup = createDefaultLineup(teamId, gameId, innings, undefined, lineupType);
  lineup.id = uuidv4();
  
  // If no fair play, clone the first inning across all innings
  if (!fairPlaySettings) {
    // Create first inning from template if provided, otherwise use empty positions
    setupFirstInning(lineup, players, templateLineup);
    
    // Clone first inning to all other innings (static lineup)
    for (let i = 2; i <= innings; i++) {
      const firstInning = lineup.innings[0];
      lineup.innings[i-1] = {
        inning: i,
        positions: [...firstInning.positions]
      };
    }
    
    return lineup;
  }
  
  // Track position history for this game to maintain continuity
  const gamePositionHistory = new Map<string, Position[]>();
  players.forEach(player => {
    // Initialize with empty array or from cross-game history if provided
    // Only use cross-game history for standard or developmental lineups (not competitive)
    const shouldUseHistory = lineupType !== 'competitive' && positionHistory !== undefined;
    gamePositionHistory.set(player.id, shouldUseHistory ? (positionHistory?.[player.id] || []) : []);
  });
  
  // Setup first inning
  setupFirstInning(lineup, players, templateLineup, options.previouslyBenchedPlayers, fairPlaySettings);
  
  // Update position history after first inning
  lineup.innings[0].positions.forEach(pos => {
    if (pos.playerId) {
      const history = gamePositionHistory.get(pos.playerId) || [];
      history.push(pos.position);
      gamePositionHistory.set(pos.playerId, history);
    }
  });
  
  // If there's only one inning, return immediately
  if (innings <= 1) return lineup;
  
  // Apply fair play rules to innings 2 through N
  applyFairPlayRules(
    lineup, 
    players, 
    fairPlaySettings, 
    lineupType, 
    gamePositionHistory,
    prioritizeContinuity
  );
  
  return lineup;
}

/**
 * Setup the first inning lineup from a template or create from scratch
 */
function setupFirstInning(
  lineup: Lineup, 
  players: Player[],
  templateLineup?: Lineup | null,
  previouslyBenchedPlayers?: string[],
  fairPlaySettings?: FairPlaySettings | null
): void {
  const availablePlayers = [...players];
  
  if (templateLineup && templateLineup.innings.length > 0) {
    // Use the template's first inning as a starting point
    const templateInning = templateLineup.innings[0];
    
    // If we need to respect "no consecutive game bench" rule
    if (fairPlaySettings?.noConsecutiveGameBench && previouslyBenchedPlayers?.length) {
      const templatePositions = [...templateInning.positions];
      const benchedPlayerIds = getBenchedPlayerIds(players, templatePositions);
      
      // Check which players were benched in both games
      const doubleBenchedPlayers = benchedPlayerIds.filter(id => 
        previouslyBenchedPlayers.includes(id)
      );
      
      // If some players would be benched twice, adjust the template
      if (doubleBenchedPlayers.length > 0) {
        for (const benchedId of doubleBenchedPlayers) {
          // Find a player currently in the field who wasn't previously benched
          const fieldPlayerIndex = templatePositions.findIndex(pos => 
            !previouslyBenchedPlayers.includes(pos.playerId)
          );
          
          if (fieldPlayerIndex !== -1) {
            // Swap the players
            const fieldPlayer = templatePositions[fieldPlayerIndex];
            const position = fieldPlayer.position;
            templatePositions[fieldPlayerIndex] = { position, playerId: benchedId };
          }
        }
      }
      
      // Copy adjusted positions to the lineup
      lineup.innings[0].positions = templatePositions;
    } else {
      // Just copy the template's first inning
      lineup.innings[0].positions = [...templateInning.positions];
    }
  } else {
    // No template provided, create a basic first inning lineup
    const fieldPositions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
    
    // Sort players by primary/secondary position to assign them
    availablePlayers.sort((a, b) => {
      // Prioritize players who were benched in previous game
      if (fairPlaySettings?.noConsecutiveGameBench && previouslyBenchedPlayers) {
        if (previouslyBenchedPlayers.includes(a.id) && !previouslyBenchedPlayers.includes(b.id)) {
          return -1;
        }
        if (!previouslyBenchedPlayers.includes(a.id) && previouslyBenchedPlayers.includes(b.id)) {
          return 1;
        }
      }
      
      // Rank by primary position count
      return b.primaryPositions.length - a.primaryPositions.length;
    });
    
    // Assign players to positions - try to match primary positions first
    const assignments: PositionAssignment[] = [];
    const assignedPlayerIds = new Set<string>();
    
    // First try to fill positions with players who have it as primary
    for (const position of fieldPositions) {
      const player = availablePlayers.find(p => 
        !assignedPlayerIds.has(p.id) && p.primaryPositions.includes(position)
      );
      
      if (player) {
        assignments.push({ position, playerId: player.id });
        assignedPlayerIds.add(player.id);
      }
    }
    
    // Then fill remaining positions with secondary preferences
    for (const position of fieldPositions) {
      if (!assignments.some(a => a.position === position)) {
        const player = availablePlayers.find(p => 
          !assignedPlayerIds.has(p.id) && p.secondaryPositions.includes(position)
        );
        
        if (player) {
          assignments.push({ position, playerId: player.id });
          assignedPlayerIds.add(player.id);
        }
      }
    }
    
    // Finally, fill any remaining positions with unassigned players
    for (const position of fieldPositions) {
      if (!assignments.some(a => a.position === position)) {
        const player = availablePlayers.find(p => !assignedPlayerIds.has(p.id));
        
        if (player) {
          assignments.push({ position, playerId: player.id });
          assignedPlayerIds.add(player.id);
        }
      }
    }
    
    lineup.innings[0].positions = assignments;
  }
}

/**
 * Apply fair play rules to generate innings 2 through N
 */
function applyFairPlayRules(
  lineup: Lineup, 
  players: Player[],
  fairPlaySettings: FairPlaySettings,
  lineupType: 'standard' | 'competitive' | 'developmental',
  positionHistory: Map<string, Position[]> = new Map(),
  prioritizeContinuity: boolean = true
): void {
  const { noConsecutiveBench, noDoubleBeforeAll, atLeastOneInfield } = fairPlaySettings;
  const totalInnings = lineup.innings.length;
  const fieldPositions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  
  // Track which players have played infield positions
  const playedInfield = new Map<string, boolean>();
  
  // Track how many times each player has been benched
  const benchCount = new Map<string, number>();
  players.forEach(p => {
    playedInfield.set(p.id, false);
    benchCount.set(p.id, 0);
  });
  
  // Check first inning for infield positions and bench counts
  const firstInning = lineup.innings[0];
  const firstInningAssignedPlayerIds = firstInning.positions
    .filter(p => fieldPositions.includes(p.position))
    .map(p => p.playerId);
  
  // Update players who played infield in inning 1
  firstInning.positions.forEach(pos => {
    if (isInfieldPosition(pos.position)) {
      playedInfield.set(pos.playerId, true);
    }
  });
  
  // Calculate benched players in first inning
  const firstInningBenched = players
    .filter(p => !firstInningAssignedPlayerIds.includes(p.id))
    .map(p => p.id);
  
  // Update bench counts
  firstInningBenched.forEach(id => {
    benchCount.set(id, (benchCount.get(id) || 0) + 1);
  });
  
  // Generate subsequent innings one by one
  for (let inningNum = 2; inningNum <= totalInnings; inningNum++) {
    // Get the previous inning
    const prevInning = lineup.innings[inningNum - 2];
    const prevInningPositions = [...prevInning.positions];
    
    // Initialize continuity factor - determines how much we prioritize keeping players in same positions
    // We'll lower this factor for competitive lineups and increase for developmental
    let continuityFactor = prioritizeContinuity ? 0.7 : 0.3; // Default value
    
    // Adjust continuity factor based on lineup type
    if (lineupType === 'competitive') {
      continuityFactor = Math.max(0.2, continuityFactor - 0.2); // Lower for competitive (more optimal positions)
    } else if (lineupType === 'developmental') {
      continuityFactor = Math.min(0.9, continuityFactor + 0.2); // Higher for developmental (more stable positions)
    }
    
    // Get assignments for this inning
    const newInningPositions = generateNextInning(
      prevInningPositions,
      players,
      {
        benchCount,
        playedInfield,
        noConsecutiveBench,
        noDoubleBeforeAll,
        atLeastOneInfield,
        fieldPositions,
        lineupType,
        inningNum,
        totalInnings,
        positionHistory,
        continuityFactor
      }
    );
    
    // Update position mapping for current inning
    lineup.innings[inningNum - 1].positions = newInningPositions;
    
    // Update position history for each player
    for (const pos of newInningPositions) {
      if (pos.playerId && fieldPositions.includes(pos.position)) {
        const history = positionHistory.get(pos.playerId) || [];
        history.push(pos.position);
        positionHistory.set(pos.playerId, history);
      }
    }
    
    // Update tracking for players in current inning
    
    // Get all players on the field this inning
    const currentInningPlayerIds = newInningPositions
      .filter(p => fieldPositions.includes(p.position))
      .map(p => p.playerId);
    
    // Find benched players this inning
    const currentInningBenched = players
      .filter(p => !currentInningPlayerIds.includes(p.id))
      .map(p => p.id);
    
    // Update bench counts
    currentInningBenched.forEach(id => {
      benchCount.set(id, (benchCount.get(id) || 0) + 1);
    });
    
    // Update infield tracking
    newInningPositions.forEach(pos => {
      if (isInfieldPosition(pos.position)) {
        playedInfield.set(pos.playerId, true);
      }
    });
  }
  
  // Final pass - if any players still haven't played infield and that rule is on,
  // try to find an inning/position to give them infield time
  if (atLeastOneInfield) {
    const needInfieldPlayers = players
      .filter(p => !playedInfield.get(p.id))
      .map(p => p.id);
    
    if (needInfieldPlayers.length > 0) {
      // For each player needing infield, try to give them at least one inning
      for (const playerId of needInfieldPlayers) {
        // Start from inning 2 (index 1) to preserve the template first inning
        for (let i = 1; i < lineup.innings.length; i++) {
          const inning = lineup.innings[i];
          // Try to find an infield position where player can be swapped in
          const infieldPositions = inning.positions.filter(pos => isInfieldPosition(pos.position));
          
          for (const infieldPos of infieldPositions) {
            // Check if the player at this position already has another infield assignment
            const currentPlayerId = infieldPos.playerId;
            let canSwap = false;
            
            // Check if this player has multiple infield innings
            let infieldInningsForPlayer = 0;
            lineup.innings.forEach(inn => {
              inn.positions.forEach(pos => {
                if (pos.playerId === currentPlayerId && isInfieldPosition(pos.position)) {
                  infieldInningsForPlayer++;
                }
              });
            });
            
            // If they have more than one infield inning, we can swap one
            if (infieldInningsForPlayer > 1) {
              canSwap = true;
            }
            
            if (canSwap) {
              // Swap the players at this position
              inning.positions = inning.positions.map(pos => {
                if (pos.position === infieldPos.position) {
                  return { ...pos, playerId };
                }
                return pos;
              });
              
              // Mark player as having played infield
              playedInfield.set(playerId, true);
              break;
            }
          }
          
          // If player now has infield, move to next player
          if (playedInfield.get(playerId)) break;
        }
      }
    }
  }
}

/**
 * Generate the positions for the next inning based on the previous inning
 */
function generateNextInning(
  prevPositions: PositionAssignment[],
  players: Player[],
  options: {
    benchCount: Map<string, number>;
    playedInfield: Map<string, boolean>;
    noConsecutiveBench: boolean;
    noDoubleBeforeAll: boolean;
    atLeastOneInfield: boolean;
    fieldPositions: Position[];
    lineupType: 'standard' | 'competitive' | 'developmental';
    inningNum: number;
    totalInnings: number;
    positionHistory?: Map<string, Position[]>;
    continuityFactor?: number;
  }
): PositionAssignment[] {
  const {
    benchCount,
    playedInfield,
    noConsecutiveBench,
    noDoubleBeforeAll,
    atLeastOneInfield,
    fieldPositions,
    lineupType,
    inningNum,
    totalInnings,
    positionHistory = new Map(),
    continuityFactor = 0.5
  } = options;
  
  // Get current field positions (exclude bench)
  const fieldPlayers = prevPositions
    .filter(pos => fieldPositions.includes(pos.position))
    .map(pos => pos.playerId);
  
  // Get all active player IDs
  const allPlayerIds = players.map(p => p.id);
  
  // Determine who was benched in the previous inning
  const benchedPlayerIds = allPlayerIds.filter(id => !fieldPlayers.includes(id));
  
  // Determine how many players will be benched this inning
  const benchSpotsNeeded = benchedPlayerIds.length;
  
  // New field and bench assignments for this inning
  let newFieldPlayers: string[] = [];
  let newBenchedPlayers: string[] = [];
  
  // Identify which players MUST move due to fair play rules
  const playersRequiredToMove: string[] = [];
  
  // Rule 1: Previously benched players must play if using noConsecutiveBench rule
  if (noConsecutiveBench && benchedPlayerIds.length > 0) {
    playersRequiredToMove.push(...benchedPlayerIds);
  }
  
  // Rule 2: Players who haven't been benched should take priority if using noDoubleBeforeAll
  if (noDoubleBeforeAll) {
    // Get players with lowest bench count
    const playersByBenchCount = new Map<string, number>();
    allPlayerIds.forEach(id => {
      playersByBenchCount.set(id, benchCount.get(id) || 0);
    });
    
    // Find players who have been benched less
    const lowestBenchCount = Math.min(...Array.from(playersByBenchCount.values()));
    const candidatesForBench = allPlayerIds.filter(id => 
      (benchCount.get(id) || 0) === lowestBenchCount && !benchedPlayerIds.includes(id)
    );
    
    // Only mark these as required to move if they're currently on the field
    // and everyone else has been benched more
    if (candidatesForBench.length > 0 && candidatesForBench.length < allPlayerIds.length) {
      // Check which of these candidates are on the field
      const fieldCandidates = candidatesForBench.filter(id => fieldPlayers.includes(id));
      // Only require them to move if we need to bench someone
      if (fieldCandidates.length > 0 && benchSpotsNeeded > 0) {
        // We need to bench someone, these candidates should be given priority
        // But don't mark more than we need
        playersRequiredToMove.push(
          ...fieldCandidates.slice(0, Math.min(fieldCandidates.length, benchSpotsNeeded))
        );
      }
    }
  }
  
  // High continuity approach - minimize changes by default
  if (continuityFactor > 0.4) {
    if (noConsecutiveBench && benchedPlayerIds.length > 0) {
      // All previously benched players must play
      newFieldPlayers = [...benchedPlayerIds];
      
      // Determine how many field players need to move to bench
      const fieldToBenchCount = benchSpotsNeeded;
      
      // First check if there are any players we must move to satisfy fair play rules
      const fieldRequiredToMove = playersRequiredToMove.filter(id => 
        fieldPlayers.includes(id) && !benchedPlayerIds.includes(id)
      );
      
      // Select additional field players to bench if needed
      const fieldToBench = fieldRequiredToMove.length >= fieldToBenchCount
        ? fieldRequiredToMove.slice(0, fieldToBenchCount)
        : [
            ...fieldRequiredToMove,
            ...selectPlayersToBench(
              fieldPlayers.filter(id => !fieldRequiredToMove.includes(id)),
              fieldToBenchCount - fieldRequiredToMove.length,
              benchCount,
              noDoubleBeforeAll,
              inningNum,
              totalInnings,
              lineupType
            )
          ];
      
      // Add remaining field players who stay on field
      fieldPlayers.forEach(id => {
        if (!fieldToBench.includes(id) && !newFieldPlayers.includes(id)) {
          newFieldPlayers.push(id);
        }
      });
      
      // Update benched players
      newBenchedPlayers = fieldToBench;
    } else {
      // Choose players to bench based on bench counts, lineup type, and fair play rules
      // First check if there are any players we must move to satisfy fair play rules
      const requiredToBench = playersRequiredToMove.filter(id => fieldPlayers.includes(id));
      
      // Select additional players to bench if needed
      newBenchedPlayers = requiredToBench.length >= benchSpotsNeeded
        ? requiredToBench.slice(0, benchSpotsNeeded)
        : [
            ...requiredToBench,
            ...selectPlayersToBench(
              allPlayerIds.filter(id => !requiredToBench.includes(id)),
              benchSpotsNeeded - requiredToBench.length,
              benchCount,
              noDoubleBeforeAll,
              inningNum,
              totalInnings,
              lineupType
            )
          ];
      
      // Everyone not benched plays
      newFieldPlayers = allPlayerIds.filter(id => !newBenchedPlayers.includes(id));
    }
  } else {
    // Lower continuity approach - closer to the original algorithm with more position changes
    if (noConsecutiveBench && benchedPlayerIds.length > 0) {
      // All previously benched players must play
      newFieldPlayers = [...benchedPlayerIds];
      
      // Determine how many field players need to move to bench
      const fieldToBenchCount = benchSpotsNeeded;
      
      // Select field players to bench
      const fieldToBench = selectPlayersToBench(
        fieldPlayers,
        fieldToBenchCount,
        benchCount,
        noDoubleBeforeAll,
        inningNum,
        totalInnings,
        lineupType
      );
      
      // Add remaining field players who stay on field
      fieldPlayers.forEach(id => {
        if (!fieldToBench.includes(id) && !newFieldPlayers.includes(id)) {
          newFieldPlayers.push(id);
        }
      });
      
      // Update benched players
      newBenchedPlayers = fieldToBench;
    } else {
      // Choose players to bench based on bench counts and lineup type
      newBenchedPlayers = selectPlayersToBench(
        allPlayerIds,
        benchSpotsNeeded,
        benchCount,
        noDoubleBeforeAll,
        inningNum,
        totalInnings,
        lineupType
      );
      
      // Everyone not benched plays
      newFieldPlayers = allPlayerIds.filter(id => !newBenchedPlayers.includes(id));
    }
  }
  
  // Assign field players to positions
  const newPositions = assignPlayersToPositions(
    newFieldPlayers,
    prevPositions,
    players,
    fieldPositions,
    playedInfield,
    atLeastOneInfield,
    lineupType,
    inningNum,
    totalInnings,
    positionHistory,
    continuityFactor
  );
  
  return newPositions;
}

/**
 * Select players to bench for the next inning
 */
function selectPlayersToBench(
  playerIds: string[],
  benchSpotsNeeded: number,
  benchCount: Map<string, number>,
  noDoubleBeforeAll: boolean,
  inningNum: number,
  totalInnings: number,
  lineupType: 'standard' | 'competitive' | 'developmental'
): string[] {
  if (benchSpotsNeeded === 0) return [];
  if (benchSpotsNeeded >= playerIds.length) return [...playerIds];
  
  // Copy player IDs to avoid mutating the input
  const candidates = [...playerIds];
  
  // Sort candidates by bench priority
  candidates.sort((a, b) => {
    // If using "no double bench before all" rule
    if (noDoubleBeforeAll) {
      const aCount = benchCount.get(a) || 0;
      const bCount = benchCount.get(b) || 0;
      
      // First priority: select players with fewer bench innings
      if (aCount !== bCount) {
        return aCount - bCount;
      }
    }
    
    // For competitive lineup type, bench key players less often
    // (for simplicity, assume 'earlier' in the array means more important)
    if (lineupType === 'competitive') {
      const aIndex = playerIds.indexOf(a);
      const bIndex = playerIds.indexOf(b);
      
      // Bias toward benching players later in the array
      // But reduce this effect in later innings to ensure fairness
      if (inningNum < totalInnings / 2) {
        return aIndex - bIndex;
      }
    }
    
    // For developmental lineup type, rotate everyone evenly
    return 0;
  });
  
  // Take first N candidates based on needed bench spots
  return candidates.slice(0, benchSpotsNeeded);
}

/**
 * Assign players to positions for the next inning
 */
function assignPlayersToPositions(
  fieldPlayerIds: string[],
  prevPositions: PositionAssignment[],
  players: Player[],
  fieldPositions: Position[],
  playedInfield: Map<string, boolean>,
  atLeastOneInfield: boolean,
  lineupType: 'standard' | 'competitive' | 'developmental',
  inningNum: number,
  totalInnings: number,
  positionHistory: Map<string, Position[]> = new Map(),
  continuityFactor: number = 0.5
): PositionAssignment[] {
  // Start with previous positions as template
  const newPositions: PositionAssignment[] = [];
  
  // Map of player ID to player
  const playerMap = new Map<string, Player>();
  players.forEach(p => playerMap.set(p.id, p));
  
  // Get previous player positions
  const prevPlayerPositions = new Map<string, Position>();
  prevPositions.forEach(pos => {
    if (fieldPositions.includes(pos.position)) {
      prevPlayerPositions.set(pos.playerId, pos.position);
    }
  });
  
  // Clone existing non-field positions (like DH or other special positions)
  prevPositions.forEach(pos => {
    if (!fieldPositions.includes(pos.position)) {
      newPositions.push({...pos});
    }
  });
  
  // Helper function to check if a player had a similar position in the previous inning
  const hadSimilarPosition = (playerId: string, position: Position): boolean => {
    const prevPos = prevPlayerPositions.get(playerId);
    if (!prevPos) return false;
    
    // Exact same position
    if (prevPos === position) return true;
    
    // Similar area (infield/outfield)
    const prevIsInfield = isInfieldPosition(prevPos);
    const currentIsInfield = isInfieldPosition(position);
    const prevIsOutfield = isOutfieldPosition(prevPos);
    const currentIsOutfield = isOutfieldPosition(position);
    
    return (prevIsInfield && currentIsInfield) || (prevIsOutfield && currentIsOutfield);
  };
  
  // Helper to get position score based on player history and preferences
  const getPositionScore = (playerId: string, position: Position): number => {
    const player = playerMap.get(playerId);
    if (!player) return 0;
    
    let score = 0;
    
    // Continuity - matching previous position
    if (prevPlayerPositions.get(playerId) === position) {
      score += 10 * continuityFactor;
    } 
    // Similar area (infield/outfield)
    else if (hadSimilarPosition(playerId, position)) {
      score += 5 * continuityFactor;
    }
    
    // Primary position match
    if (player.primaryPositions.includes(position)) {
      // For competitive, prioritize primary positions
      // For developmental, reduce importance
      const primaryFactor = lineupType === 'competitive' ? 0.8 : 
                          lineupType === 'developmental' ? 0.2 : 0.5;
      score += 7 * primaryFactor * (1 - continuityFactor);
    }
    
    // Secondary position match
    if (player.secondaryPositions.includes(position)) {
      // For developmental, prioritize secondary positions
      // For competitive, reduce importance
      const secondaryFactor = lineupType === 'developmental' ? 0.8 : 
                            lineupType === 'competitive' ? 0.2 : 0.5;
      score += 5 * secondaryFactor * (1 - continuityFactor);
    }
    
    // Position experience (from position history)
    const history = positionHistory.get(playerId) || [];
    const positionPlayed = history.filter(p => p === position).length;
    
    // For developmental lineups, give bonus to positions played less often
    if (lineupType === 'developmental' && positionPlayed === 0) {
      score += 3 * (1 - continuityFactor); // Bonus for new position in developmental
    } 
    // For competitive lineups, give bonus to positions played more often
    else if (lineupType === 'competitive' && positionPlayed > 0) {
      score += Math.min(3, positionPlayed) * (1 - continuityFactor); // Bonus for familiar position in competitive
    }
    
    // Infield experience need
    if (atLeastOneInfield && isInfieldPosition(position) && !playedInfield.get(playerId)) {
      score += 15; // High priority if player needs infield time
    }
    
    return score;
  };
  
  // For developmental lineup, prioritize giving players their secondary positions
  // For competitive lineup, prioritize giving players their primary positions
  // For standard lineup, use a balanced approach
  
  // Track which players have been assigned
  const assignedPlayers = new Set<string>();
  
  // If using high continuity, try to maintain positions from previous inning
  if (continuityFactor > 0.6) {
    // First, handle any players who need infield time (highest priority)
    if (atLeastOneInfield) {
      const needInfieldPlayers = fieldPlayerIds.filter(id => !playedInfield.get(id));
      
      if (needInfieldPlayers.length > 0) {
        for (const position of fieldPositions) {
          if (!isInfieldPosition(position)) continue;
          
          // Find an unassigned player who needs infield time
          const player = needInfieldPlayers.find(id => !assignedPlayers.has(id));
          if (player) {
            newPositions.push({ position, playerId: player });
            assignedPlayers.add(player);
          }
        }
      }
    }
    
    // Try to keep players in the same positions if they're still on the field
    for (const position of fieldPositions) {
      // Skip if position already filled
      if (newPositions.some(p => p.position === position)) continue;
      
      // Get the player who was in this position in the previous inning
      const prevAssignment = prevPositions.find(p => p.position === position);
      const prevPlayerId = prevAssignment?.playerId;
      
      if (prevPlayerId && 
          fieldPlayerIds.includes(prevPlayerId) && 
          !assignedPlayers.has(prevPlayerId)) {
        // Keep player in same position if they're still on field
        newPositions.push({ position, playerId: prevPlayerId });
        assignedPlayers.add(prevPlayerId);
      }
    }
  }
  
  // Assign remaining positions based on scores
  for (const position of fieldPositions) {
    // Skip if position already filled
    if (newPositions.some(p => p.position === position)) continue;
    
    // Calculate scores for each unassigned player for this position
    const playerScores = fieldPlayerIds
      .filter(id => !assignedPlayers.has(id))
      .map(id => ({
        id,
        score: getPositionScore(id, position)
      }))
      .sort((a, b) => b.score - a.score);
    
    // Assign the player with the highest score
    if (playerScores.length > 0) {
      newPositions.push({ position, playerId: playerScores[0].id });
      assignedPlayers.add(playerScores[0].id);
    }
  }
  
  // Fallback - if any positions still unassigned, just assign any available player
  for (const position of fieldPositions) {
    if (!newPositions.some(p => p.position === position)) {
      const anyPlayer = fieldPlayerIds.find(id => !assignedPlayers.has(id));
      if (anyPlayer) {
        newPositions.push({ position, playerId: anyPlayer });
        assignedPlayers.add(anyPlayer);
      }
    }
  }
  // The old algorithm branches are no longer needed since we handle everything with the scoring system
  // that takes into account lineup type, continuity preferences, and position history
  /* Legacy code removed - replaced by the scoring system above */
  
  // Final check: make sure all field positions are filled
  for (const position of fieldPositions) {
    if (!newPositions.some(p => p.position === position)) {
      // Find any unassigned player
      const anyPlayer = fieldPlayerIds.find(id => !assignedPlayers.has(id));
      if (anyPlayer) {
        newPositions.push({ position, playerId: anyPlayer });
        assignedPlayers.add(anyPlayer);
      }
    }
  }
  
  return newPositions;
}

/**
 * Get player IDs for players who are benched given a set of positions
 */
function getBenchedPlayerIds(allPlayers: Player[], positions: PositionAssignment[]): string[] {
  const fieldPositions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  const assignedPlayerIds = positions
    .filter(pos => fieldPositions.includes(pos.position))
    .map(pos => pos.playerId);
  
  return allPlayers
    .filter(p => p.active && !assignedPlayerIds.includes(p.id))
    .map(p => p.id);
}