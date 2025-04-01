/**
 * Custom hook for using the reference-based position history system
 * This hook provides an easy way to access position metrics for a player
 * or team without worrying about the details of how the data is stored.
 * 
 * This hook always uses the client-side API approach for accessing position history data.
 */
import { useState, useEffect, useCallback } from 'react';
import { positionHistoryService } from '../services/position/position-history-service';
import { PlayerPositionHistory, TimeframePositionMetrics } from '../types/position-history';

/**
 * Hook for accessing a player's position history
 */
export const usePlayerPositionHistory = (
  playerId: string,
  teamId: string,
  season?: string
) => {
  const [positionHistory, setPositionHistory] = useState<PlayerPositionHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load position history
  useEffect(() => {
    const loadPositionHistory = async () => {
      if (!playerId || !teamId) {
        setPositionHistory(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const history = await positionHistoryService.getPlayerPositionHistory(
          playerId,
          teamId,
          season
        );
        setPositionHistory(history);
      } catch (err) {
        console.error('Error loading position history:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadPositionHistory();
  }, [playerId, teamId, season]);

  // Helper to get metrics for a specific timeframe
  const getMetricsForTimeframe = useCallback((timeframe: 'season' | 'last5Games' | 'last3Games' | 'lastGame'): TimeframePositionMetrics | null => {
    if (!positionHistory || !positionHistory.metrics) return null;
    return positionHistory.metrics[timeframe];
  }, [positionHistory]);

  // Get all position metrics
  const getAllMetrics = useCallback(() => {
    if (!positionHistory) return null;
    return positionHistory.metrics;
  }, [positionHistory]);

  // Force refresh position history
  const refreshPositionHistory = useCallback(async () => {
    if (!playerId || !teamId) return;

    setIsLoading(true);
    setError(null);

    try {
      const history = await positionHistoryService.getPlayerPositionHistory(
        playerId,
        teamId,
        season
      );
      setPositionHistory(history);
    } catch (err) {
      console.error('Error refreshing position history:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [playerId, teamId, season]);

  return {
    positionHistory,
    isLoading,
    error,
    getMetricsForTimeframe,
    getAllMetrics,
    refreshPositionHistory
  };
};

/**
 * Hook for accessing team-wide position histories
 */
export const useTeamPositionHistories = (
  teamId: string,
  season?: string
) => {
  const [positionHistories, setPositionHistories] = useState<PlayerPositionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load team position histories
  useEffect(() => {
    const loadTeamPositionHistories = async () => {
      if (!teamId) {
        setPositionHistories([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const histories = await positionHistoryService.getTeamPositionHistories(
          teamId,
          season
        );
        setPositionHistories(histories);
      } catch (err) {
        console.error('Error loading team position histories:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamPositionHistories();
  }, [teamId, season]);

  // Get position history for a specific player
  const getPlayerHistory = useCallback((playerId: string): PlayerPositionHistory | null => {
    return positionHistories.find(history => history.playerId === playerId) || null;
  }, [positionHistories]);

  // Get metrics for a specific player and timeframe
  const getPlayerMetrics = useCallback((
    playerId: string,
    timeframe: 'season' | 'last5Games' | 'last3Games' | 'lastGame'
  ): TimeframePositionMetrics | null => {
    const history = positionHistories.find(h => h.playerId === playerId);
    if (!history || !history.metrics) return null;
    return history.metrics[timeframe];
  }, [positionHistories]);

  // Force refresh team position histories
  const refreshTeamPositionHistories = useCallback(async () => {
    if (!teamId) return;

    setIsLoading(true);
    setError(null);

    try {
      const histories = await positionHistoryService.getTeamPositionHistories(
        teamId,
        season
      );
      setPositionHistories(histories);
    } catch (err) {
      console.error('Error refreshing team position histories:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [teamId, season]);

  // Get players with specific position needs
  const getPlayersWithPositionNeeds = useCallback((needType: 'infield' | 'outfield'): string[] => {
    return positionHistories
      .filter(history => {
        const seasonMetrics = history.metrics.season;
        return needType === 'infield' 
          ? seasonMetrics.needsInfield 
          : seasonMetrics.needsOutfield;
      })
      .map(history => history.playerId);
  }, [positionHistories]);

  // Get players with highest bench time
  const getPlayersWithHighestBenchTime = useCallback((limit: number = 3): Array<{playerId: string, benchPercentage: number}> => {
    return positionHistories
      .map(history => ({
        playerId: history.playerId,
        benchPercentage: history.metrics.season.benchPercentage
      }))
      .sort((a, b) => b.benchPercentage - a.benchPercentage)
      .slice(0, limit);
  }, [positionHistories]);

  return {
    positionHistories,
    isLoading,
    error,
    getPlayerHistory,
    getPlayerMetrics,
    refreshTeamPositionHistories,
    getPlayersWithPositionNeeds,
    getPlayersWithHighestBenchTime
  };
};

export default usePlayerPositionHistory;