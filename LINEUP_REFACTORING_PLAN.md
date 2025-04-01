# Position Tracking System Refactoring Plan

## Current Issues
The current position tracking system in the application is inefficient and has several notable problems:

1. **Inefficient Data Processing**
   - Uses nested loops to analyze position data (O(n³) complexity)
   - Repeatedly processes the same data for different metrics
   - Calculates everything from scratch on each access

2. **No Proper Caching**
   - Doesn't cache computed metrics
   - Recalculates position distributions for every request
   - Poor performance with growing game history

3. **Data Structure Issues**
   - Potential data duplication of position information
   - No clear separation between raw data and derived metrics
   - Scales poorly as team history grows

## Proposed Solution

We will implement a MongoDB-only reference-based position history system that:

1. **Eliminates Data Duplication**
   - Stores only game references, not position data
   - Uses the game lineups as the single source of truth
   - Pre-computes and caches metrics for fast access

2. **Optimizes Performance**
   - Reduces complexity from O(n³) to mostly O(1) operations
   - Pre-calculates metrics at various time scales (1, 3, 5 games, season)
   - Updates metrics incrementally when games change

3. **Improves Developer Experience**
   - Provides a clear, consistent API for accessing position metrics
   - Separates raw data from calculated metrics
   - Makes lineup generator code more readable and maintainable

## Important: MongoDB-Only Implementation

This new position tracking system will exclusively use MongoDB for storage:

- **No Local Storage**: We are not implementing any local storage functionality
- **No Offline Support**: All position tracking requires database connectivity
- **MongoDB Required**: This system depends entirely on MongoDB for data persistence
- **Single Source of Truth**: MongoDB is the only place position history is stored

This decision simplifies the implementation by focusing on a single, reliable data storage mechanism. We may revisit limited offline capabilities in the future, but the current system is designed for online-only usage.

## Implementation Plan

### Phase 1: Data Model Updates

Create new data models for position history tracking:

```typescript
// Specialized Position History Collection
interface PlayerPositionHistory {
  playerId: string;
  teamId: string;
  season: string;
  
  // Only store references to games, not position data itself
  gamesPlayed: string[]; // Array of gameIds
  
  // Pre-computed metrics that get updated after each game
  metrics: {
    season: TimeframePositionMetrics;
    last5Games: TimeframePositionMetrics; 
    last3Games: TimeframePositionMetrics;
    lastGame: TimeframePositionMetrics;
  };
  
  // Last updated timestamp
  updatedAt: number;
}

interface TimeframePositionMetrics {
  // Position counts and percentages
  positionCounts: Record<Position, number>;
  positionPercentages: Record<Position, number>;
  
  // Position type counts and percentages
  positionTypeCounts: Record<PositionType, number>;
  positionTypePercentages: Record<PositionType, number>;
  
  // Fair play metrics
  benchPercentage: number;
  varietyScore: number;
  consecutiveBench: number;
  benchStreak: {
    current: number;
    max: number;
  };
  
  // Position needs
  needsInfield: boolean;
  needsOutfield: boolean;
  
  // Total stats
  totalInnings: number;
  gamesPlayed: number;
  
  // Additional metrics
  playingTimePercentage: number;
  samePositionStreak?: {
    position: Position | null;
    count: number;
  };
}
```

### Phase 2: Core Services

1. **Create Position History Service**
   - Develop MongoDB-based functions to create, read, update position history
   - Implement metrics calculation logic
   - Create MongoDB schema with appropriate indexes

2. **Implement Update Triggers**
   - Add hooks to game lineup creation/updates
   - Trigger position history updates when lineups change
   - Handle batch updates for data imports

3. **Optimize Metric Calculations**
   - Implement efficient algorithms for metrics
   - Create incremental update patterns
   - Add server-side caching for calculated values

### Phase 3: API & Integration

1. **Create API Endpoints**
   - Add MongoDB-backed endpoints for position history access
   - Implement query parameters for filtering
   - Add bulk operations for team-wide updates

2. **Update Lineup Generator**
   - Modify lineup generator to use new position history
   - Implement fair play decision making with cached metrics
   - Add bench streak prevention logic

3. **Update UI Components**
   - Modify position dashboards to use new data source
   - Update fair play visualizations
   - Add new insights based on improved metrics

### Phase 4: Testing & Optimization

1. **Automated Tests**
   - Write unit tests for metric calculations
   - Create integration tests for update flows
   - Test performance with large datasets

2. **Performance Benchmarking**
   - Compare old vs new implementation performance
   - Identify bottlenecks and optimize
   - Test with synthetic large datasets

3. **Database Optimization**
   - Create appropriate MongoDB indexes for common queries
   - Implement server-side query optimization
   - Create monitoring for position history performance

## Timeline

- **Phase 1:** 1 week
- **Phase 2:** 2 weeks
- **Phase 3:** 1 week
- **Phase 4:** 1 week

Total estimated time: 5 weeks

## Success Criteria

1. Position metrics access time reduced by at least 80%
2. No duplication of position data across the database
3. Lineup generation process maintains accurate fair play calculations
4. UI components display correct position history and metrics
5. System scalability improved to handle teams with 50+ games
6. All tests passing with 90%+ coverage
7. MongoDB queries optimized with proper indexes