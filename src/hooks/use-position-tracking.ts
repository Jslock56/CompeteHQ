import { useMemo, useState, useEffect } from 'react';
import { Player } from '../types/player';
import { Game } from '../types/game';
import { Lineup } from '../types/lineup';
import { PositionBreakdown, TeamFairPlayMetrics } from '../types/position-metrics';
import { 
  getGamesWithPositions, 
  getLastBenchStart,
  getPositionMetrics,
  getTeamPositionDistribution,
  GameWithPosition,
  PositionType
} from '../utils/position-utils';
import {
  generatePositionTimeline,
  generatePositionBreakdown,
  generatePositionGrid,
  generatePositionHeatmap,
  generatePositionTypeChart
} from '../utils/position-visualization';
import { positionHistoryStorage } from '../services/storage/enhanced-storage';

/**
 * Hook for accessing a player's position tracking data
 */
export const usePlayerPositionTracking = (
  playerId: string,
  player: Player | null,
  games: Game[],
  lineups: Record<string, Lineup>
) => {
  // Calculate games with positions
  const gamesWithPositions = useMemo(() => {
    if (!playerId || !games.length) return [];
    
    // Try to use the stored position history
    try {
      // First, check if we have stored position history
      const storedHistory = positionHistoryStorage.getPositionHistory(playerId);
      if (storedHistory && storedHistory.gamePositions && storedHistory.gamePositions.length > 0) {
        console.log("Found stored position history for player:", playerId, storedHistory.gamePositions.length, "games");
        // Convert stored history to GameWithPosition format
        return storedHistory.gamePositions.map(gamePos => {
          const game = games.find(g => g.id === gamePos.gameId);
          return {
            gameId: gamePos.gameId,
            gameDate: gamePos.gameDate,
            opponent: game?.opponent || 'Unknown',
            startingPosition: gamePos.innings.length > 0 ? gamePos.innings[0].position : 'BN',
            inningPositions: gamePos.innings
          };
        });
      }
    } catch (error) {
      console.error("Error accessing stored position history:", error);
    }
    
    console.log("Calculating position history from scratch for player:", playerId);
    // If no stored history or error, calculate from scratch
    return getGamesWithPositions(playerId, games, lineups);
  }, [playerId, games, lineups]);
  
  // Calculate position metrics
  const positionMetrics = useMemo(() => {
    if (!playerId || !gamesWithPositions.length) return null;
    return getPositionMetrics(playerId, gamesWithPositions);
  }, [playerId, gamesWithPositions]);
  
  // Generate position breakdown for different time frames
  const positionBreakdown = useMemo((): PositionBreakdown | null => {
    if (!playerId || !gamesWithPositions.length) return null;
    
    const breakdown = generatePositionBreakdown(playerId, gamesWithPositions);
    const timeline = generatePositionTimeline(gamesWithPositions);
    
    // Get last bench start
    const lastBenchStartGame = gamesWithPositions.find(g => g.startingPosition === 'BN');
    
    return {
      ...breakdown,
      timeline,
      lastBenchStart: lastBenchStartGame?.gameDate || null,
      benchStreakCurrent: positionMetrics?.benchStreakCurrent || 0,
      benchStreakMax: positionMetrics?.benchStreakMax || 0
    };
  }, [playerId, gamesWithPositions, positionMetrics]);
  
  // Generate position grid data
  const positionGrid = useMemo(() => {
    if (!playerId || !gamesWithPositions.length) return [];
    return generatePositionGrid(gamesWithPositions);
  }, [playerId, gamesWithPositions]);
  
  // Generate position heatmap data
  const positionHeatmap = useMemo(() => {
    if (!playerId || !gamesWithPositions.length) return null;
    return generatePositionHeatmap(gamesWithPositions);
  }, [playerId, gamesWithPositions]);
  
  return {
    gamesWithPositions,
    positionMetrics,
    positionBreakdown,
    positionGrid,
    positionHeatmap,
    isLoading: !gamesWithPositions
  };
};

/**
 * Hook for accessing team-level position tracking data
 */
export const useTeamPositionTracking = (
  teamId: string,
  players: Player[],
  games: Game[],
  lineups: Record<string, Lineup>
) => {
  // Track position data for each player
  const [gamesWithPositionsByPlayer, setGamesWithPositionsByPlayer] = useState<Record<string, GameWithPosition[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate games with positions for each player
  useEffect(() => {
    if (!teamId || !players.length || !games.length) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    const playerGames: Record<string, GameWithPosition[]> = {};
    
    // Only process active players
    const activePlayers = players.filter(p => p.active);
    
    // Try to use stored position histories
    try {
      const storedHistories = positionHistoryStorage.getTeamPositionHistories(teamId);
      if (storedHistories && storedHistories.length > 0) {
        console.log("Found stored team position histories:", storedHistories.length);
        const storedHistoriesByPlayer = Object.fromEntries(
          storedHistories.map(history => [history.playerId, history])
        );
        
        activePlayers.forEach(player => {
          const storedHistory = storedHistoriesByPlayer[player.id];
          
          if (storedHistory && storedHistory.gamePositions && storedHistory.gamePositions.length > 0) {
            // Convert stored history to GameWithPosition format
            playerGames[player.id] = storedHistory.gamePositions.map(gamePos => {
              const game = games.find(g => g.id === gamePos.gameId);
              return {
                gameId: gamePos.gameId,
                gameDate: gamePos.gameDate,
                opponent: game?.opponent || 'Unknown',
                startingPosition: gamePos.innings.length > 0 ? gamePos.innings[0].position : 'BN',
                inningPositions: gamePos.innings
              };
            });
          } else {
            // Calculate from scratch if no stored history
            playerGames[player.id] = getGamesWithPositions(player.id, games, lineups);
          }
        });
      } else {
        console.log("No stored team position histories, calculating from scratch");
        // Calculate all from scratch
        activePlayers.forEach(player => {
          playerGames[player.id] = getGamesWithPositions(player.id, games, lineups);
        });
      }
    } catch (error) {
      console.error("Error accessing team position histories:", error);
      // Calculate all from scratch on error
      activePlayers.forEach(player => {
        playerGames[player.id] = getGamesWithPositions(player.id, games, lineups);
      });
    }
    
    setGamesWithPositionsByPlayer(playerGames);
    setIsLoading(false);
  }, [teamId, players, games, lineups]);
  
  // Calculate team position distribution
  const teamDistribution = useMemo(() => {
    if (!teamId || !players.length || isLoading) return null;
    return getTeamPositionDistribution(teamId, players, gamesWithPositionsByPlayer);
  }, [teamId, players, gamesWithPositionsByPlayer, isLoading]);
  
  // Calculate fair play metrics for different time frames
  const fairPlayMetrics = useMemo((): Record<string, TeamFairPlayMetrics> | null => {
    if (!teamId || !players.length || isLoading || !teamDistribution) return null;
    
    // Prepare active players
    const activePlayers = players.filter(p => p.active);
    
    // Calculate average playing time
    const avgPlayingTime = activePlayers
      .map(player => {
        const metrics = getPositionMetrics(player.id, gamesWithPositionsByPlayer[player.id] || []);
        return metrics?.playingTimePercentage || 0;
      })
      .reduce((sum, pct) => sum + pct, 0) / activePlayers.length;
    
    // Calculate metrics for each time frame
    const createMetricsForTimeFrame = (gameCount?: number) => {
      const distribution = gameCount 
        ? getTeamPositionDistribution(teamId, players, gamesWithPositionsByPlayer, gameCount)
        : teamDistribution;
      
      // Transform data for UI consumption
      const mostBenchTime = distribution.mostBench.map(playerId => ({
        playerId,
        benchPercentage: distribution.playerDistributions[playerId]?.positionPercentages['BN'] || 0
      }));
      
      const leastVariety = distribution.leastVariety.map(playerId => {
        const metrics = getPositionMetrics(playerId, gamesWithPositionsByPlayer[playerId] || []);
        return {
          playerId,
          varietyScore: metrics?.varietyScore || 0
        };
      });
      
      const needsExperience = [
        ...distribution.needsInfield.map(playerId => ({
          playerId,
          positionTypes: [PositionType.INFIELD] as PositionType[]
        })),
        ...distribution.needsOutfield.map(playerId => ({
          playerId,
          positionTypes: [PositionType.OUTFIELD] as PositionType[]
        }))
      ];
      
      // Calculate playing time imbalance
      const playingTimeImbalance = activePlayers
        .map(player => {
          const metrics = getPositionMetrics(player.id, gamesWithPositionsByPlayer[player.id] || []);
          const playingTimePercentage = metrics?.playingTimePercentage || 0;
          return {
            playerId: player.id,
            playingTimePercentage,
            avgTeamPlayingTime: avgPlayingTime,
            difference: playingTimePercentage - avgPlayingTime
          };
        })
        .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
        .slice(0, 5);
      
      return {
        fairPlayScore: distribution.fairPlayScore,
        mostBenchTime,
        leastVariety,
        needsExperience,
        playingTimeImbalance
      };
    };
    
    return {
      last3Games: createMetricsForTimeFrame(3),
      last5Games: createMetricsForTimeFrame(5),
      last10Games: createMetricsForTimeFrame(10),
      season: createMetricsForTimeFrame()
    };
  }, [teamId, players, gamesWithPositionsByPlayer, isLoading, teamDistribution]);
  
  return {
    teamDistribution,
    fairPlayMetrics,
    gamesWithPositionsByPlayer,
    isLoading
  };
};