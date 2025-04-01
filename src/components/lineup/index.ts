/**
 * Lineup components index
 * Central export for all lineup-related components
 */

// Game lineup components
export { default as GameLineupBuilder } from './games/lineup-builder-spreadsheet';

// Template lineup components
export { default as TemplateLineupBuilder } from './templates/field-position-lineup-builder';

// Common components
export { default as FairPlayChecker } from './common/FairPlayChecker';

// Legacy/backward compatibility exports
export { default as LineupBuilderSpreadsheet } from './games/lineup-builder-spreadsheet';
export { default as FieldPositionLineupBuilder } from './templates/field-position-lineup-builder';