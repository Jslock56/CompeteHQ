# CompeteHQ - Baseball Coach App: Complete Codebase Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Project Structure](#project-structure)
4. [Core Data Models](#core-data-models)
5. [Key Components & Features](#key-components--features)
6. [State Management](#state-management)
7. [API Layer & Backend Integration](#api-layer--backend-integration)
8. [UI & Design System](#ui--design-system)
9. [Authentication & User Management](#authentication--user-management)
10. [Development Workflow](#development-workflow)
11. [Deployment](#deployment)
12. [Testing Strategy](#testing-strategy)
13. [Development Roadmap](#development-roadmap)
14. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

## Project Overview

CompeteHQ is a comprehensive web application designed to help youth baseball coaches manage their teams more effectively. The platform focuses on solving the most painful problems coaches face:

1. **Ensuring fair play** - Track which positions players have played to ensure everyone gets equal opportunities
2. **Creating balanced lineups** - Efficiently create and manage game lineups and position assignments
3. **Organizing effective practices** - Generate structured practice plans based on team needs

### Core Principles

The application is built around these key principles:
- **Simplicity with depth** - Easy to use on the field, yet powerful enough for sophisticated coaching
- **Value first** - Prioritize features that deliver immediate value
- **Progressive complexity** - Start simple, add sophistication as needed
- **Mobile-first** - Design for on-field use on phones and tablets
- **Data-driven decisions** - Use metrics to guide coach decisions and product development

### Target Users

- Head coaches of youth baseball teams
- Assistant coaches
- Team parents and fans
- League and organization administrators (future)

## Architecture & Technology Stack

CompeteHQ is built with a modern JavaScript/TypeScript stack:

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) - React framework with server-side rendering and app router
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **UI Library**: [Chakra UI](https://chakra-ui.com/) - Component library for accessible, responsive interfaces
- **Icons**: [Chakra icons](https://chakra-ui.com/docs/components/icon) and [React Icons](https://react-icons.github.io/react-icons/)
- **State Management**: React Context with Custom Hooks
- **Data Fetching**: Modern hooks patterns with Next.js API routes

### Backend
- **API Routes**: Next.js API Routes
- **Database**: [MongoDB](https://www.mongodb.com/) - NoSQL database for flexible data storage
- **Authentication**: JWT-based auth with cookies
- **Data Storage**: MongoDB-only cloud storage approach

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Version Control**: Git (GitHub)
- **Deployment**: Vercel (planned)

## Project Structure

The project follows a structured Next.js app directory layout with custom organization for clarity:

```
competehq/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   │   ├── (auth)/      # Authentication pages
│   │   ├── (dashboard)/ # Dashboard pages
│   │   ├── api/         # API routes
│   │   ├── games/       # Game management pages
│   │   ├── lineup/      # Lineup management pages
│   │   ├── roster/      # Player management pages
│   │   └── teams/       # Team management pages
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Shared components
│   │   ├── forms/       # Form components
│   │   ├── games/       # Game-related components
│   │   ├── layout/      # Layout components
│   │   ├── lineup/      # Lineup builder components
│   │   ├── roster/      # Player management components
│   │   └── ui/          # Base UI components
│   ├── contexts/        # React context providers
│   │   ├── auth-context.tsx      # Authentication context
│   │   ├── storage-context.tsx   # Storage context
│   │   └── team-context.tsx      # Team management context
│   ├── hooks/           # Custom React hooks
│   │   ├── use-games.ts       # Game management hook
│   │   ├── use-lineup.ts      # Lineup operations hook
│   │   ├── use-players.ts     # Player management hook
│   │   └── use-team.ts        # Team management hook
│   ├── models/          # Database models (Mongoose schemas)
│   ├── services/        # Service integrations
│   │   ├── api/         # API service clients
│   │   ├── auth/        # Authentication services
│   │   ├── database/    # Database services
│   │   └── storage/     # Storage services
│   ├── store/           # State management
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript type definitions
│   │   ├── game.ts      # Game data types
│   │   ├── lineup.ts    # Lineup data types
│   │   ├── player.ts    # Player data types
│   │   └── team.ts      # Team data types
│   └── utils/           # Utility functions
```

### Key Directories and Files

- **`/src/app`**: Next.js app router pages, organized by feature
- **`/src/components`**: React components, organized by domain/feature
- **`/src/contexts`**: React contexts for global state management
- **`/src/hooks`**: Custom React hooks for shared logic
- **`/src/types`**: TypeScript type definitions for all data models
- **`/src/services`**: Service layer interfaces (API, storage, etc.)

## Core Data Models

The application is built around these primary data models:

### Team

```typescript
// src/types/team.ts
interface Team {
  id: string;
  name: string;
  ageGroup: string;
  season: string;
  sport: string;  // 'baseball' or 'softball'
  description?: string;
  players: string[];  // Array of player IDs
  games: string[];    // Array of game IDs
  createdAt: number;  // Timestamp
  updatedAt: number;  // Timestamp
  createdBy: string;  // User ID of creator
  joinRequiresApproval: boolean;
  isPublic: boolean;
}
```

### Player

```typescript
// src/types/player.ts
type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'BN';

interface Player {
  id: string;
  teamId: string;
  name?: string;        // Full name
  firstName: string;    // First name
  lastName: string;     // Last name
  jerseyNumber: number; // Jersey number
  primaryPositions: Position[];     // Primary positions
  secondaryPositions: Position[];   // Secondary positions
  notes?: string;       // Notes about player
  battingOrder?: number; // Default batting order position
  active: boolean;      // Whether player is active
  createdAt: number;    // Timestamp
  updatedAt: number;    // Timestamp
}
```

### Game

```typescript
// src/types/game.ts
interface Game {
  id: string;
  teamId: string;
  opponent: string;
  date: number;           // Timestamp
  location: string;
  isHome?: boolean;        // Home or away game
  innings: number;         // Number of innings
  status: 'scheduled' | 'in-progress' | 'completed' | 'canceled';
  homeScore?: number;      // Our score (if home)
  awayScore?: number;      // Our score (if away)
  result?: 'win' | 'loss' | 'tie' | null;  // Game result
  lineupId?: string;       // ID of associated lineup
  notes?: string;          // Game notes
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}
```

### Lineup

```typescript
// src/types/lineup.ts
interface LineupPosition {
  position: Position;
  playerId: string;
}

interface LineupInning {
  inning: number;
  positions: LineupPosition[];
}

interface Lineup {
  id: string;
  teamId: string;
  name: string;
  gameId?: string;         // Optional: linked game
  type: 'standard' | 'competitive' | 'developmental';
  innings: LineupInning[];
  isDefault?: boolean;     // Is this a default lineup template
  status?: 'draft' | 'final';
  createdAt: number;
  updatedAt: number;
}
```

### Practice

```typescript
// src/types/practice.ts
interface Drill {
  id: string;
  name: string;
  duration: number;      // Minutes
  focusArea: string;     // Skill focus
  equipment: string[];   // Required equipment
  description: string;   // Instructions
  playerMin: number;     // Minimum players needed
  playerMax?: number;    // Maximum players
  coachesNeeded: number; // Number of coaches required
}

interface Practice {
  id: string;
  teamId: string;
  title: string;
  date: number;          // Timestamp
  location: string;
  duration: number;      // Minutes
  notes?: string;        // Additional notes
  drills: Drill[];       // Practice drills
  createdAt: number;     // Timestamp
  updatedAt: number;     // Timestamp
}
```

### User

```typescript
// src/models/user.ts
enum Permission {
  VIEW_LINEUPS = 'view:lineups',
  MANAGE_LINEUPS = 'manage:lineups',
  VIEW_PLAYERS = 'view:players',
  MANAGE_PLAYERS = 'manage:players',
  VIEW_GAMES = 'view:games',
  MANAGE_GAMES = 'manage:games',
  VIEW_SCHEDULE = 'view:schedule',
  VIEW_STATS = 'view:stats',
  APPROVE_FANS = 'approve:fans',
  MANAGE_USERS = 'manage:users'
}

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
  teams: string[];         // Array of team IDs
  activeTeamId?: string;  // Currently selected team
  isEmailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}
```

## Key Components & Features

CompeteHQ is organized around these core features:

### 1. Team Management

The team management module allows users to:
- Create new teams
- View and edit team details
- Manage team members and permissions
- Join teams with invite codes

**Key Files:**
- `/src/app/teams/page.tsx`: Team listing page
- `/src/app/teams/new/page.tsx`: Create team page
- `/src/app/teams/[id]/page.tsx`: Team details page
- `/src/app/teams/[id]/members/page.tsx`: Team members management
- `/src/components/forms/team-form.tsx`: Team creation/editing form
- `/src/hooks/use-team.ts`: Team management hooks

### 2. Roster Management

The roster management module handles player-related operations:
- Add and edit players
- View player details
- Track position preferences
- Manage active/inactive status

**Key Files:**
- `/src/app/roster/page.tsx`: Roster listing page
- `/src/app/roster/new/page.tsx`: Add player page
- `/src/app/roster/[id]/page.tsx`: Player details page
- `/src/app/roster/[id]/edit/page.tsx`: Edit player page
- `/src/components/forms/player-form.tsx`: Player creation/editing form
- `/src/components/roster/player-list.tsx`: Player listing component
- `/src/hooks/use-players.ts`: Player management hooks

### 3. Game Management

The game management module handles scheduling and tracking games:
- Schedule games
- View game details
- Record game results
- Link lineups to games

**Key Files:**
- `/src/app/games/page.tsx`: Game listing page
- `/src/app/games/new/page.tsx`: Schedule game page
- `/src/app/games/[id]/page.tsx`: Game details page
- `/src/app/games/[id]/edit/page.tsx`: Edit game page
- `/src/components/forms/game-form.tsx`: Game creation/editing form
- `/src/components/games/game-list.tsx`: Game listing component
- `/src/hooks/use-games.ts`: Game management hooks

### 4. Lineup Management

The lineup management module is the core of the application:
- Create lineups for games
- Build field position templates
- Assign players to positions by inning
- Track position history and fair play
- Auto-generate balanced lineups

**Key Files:**
- `/src/app/lineup/page.tsx`: Lineup landing page
- `/src/app/lineup/dashboard/page.tsx`: Lineup dashboard
- `/src/app/lineup/new/page.tsx`: Create new lineup page
- `/src/app/lineup/[id]/page.tsx`: View lineup details
- `/src/app/lineup/[id]/edit/page.tsx`: Edit lineup page
- `/src/app/games/[id]/lineup/create/page.tsx`: Create game lineup
- `/src/components/lineup/lineup-builder-spreadsheet.tsx`: Grid-based lineup editor
- `/src/components/lineup/field-position-lineup-builder.tsx`: Field position editor
- `/src/hooks/use-lineup.ts`: Lineup operations hooks

### 5. Fair Play Tracking

The fair play system ensures equitable playing time and position variety:
- Track positions played per player
- Visualize position distribution
- Calculate fair play metrics
- Highlight imbalances and provide recommendations

**Key Files:**
- `/src/components/roster/player-position-dashboard.tsx`: Position history dashboard
- `/src/components/lineup/components/FairPlayChecker.tsx`: Lineup validation
- `/src/utils/fair-play-utils.ts`: Fair play calculation utilities

### 6. Authentication & User Management

The auth system manages users and permissions:
- User registration and login
- Team invitations and join requests
- Role-based permissions
- Team member management

**Key Files:**
- `/src/app/(auth)/login/page.tsx`: Login page
- `/src/app/(auth)/signup/page.tsx`: Registration page
- `/src/contexts/auth-context.tsx`: Authentication context
- `/src/services/auth/auth-service.ts`: Authentication service
- `/src/models/user.ts`: User model and permissions

## State Management

CompeteHQ uses a combination of React Context, custom hooks, and local storage for state management:

### Context Providers

Three main context providers manage global state:

1. **Auth Context** (`/src/contexts/auth-context.tsx`)
   - Manages user authentication state
   - Handles login, registration, and logout
   - Provides user information to other components

2. **Team Context** (`/src/contexts/team-context.tsx`)
   - Manages active team selection
   - Provides team information to components
   - Wraps most application pages to ensure team context is available

3. **Storage Context** (`/src/contexts/storage-context.tsx`)
   - Manages the storage strategy (local vs. cloud)
   - Provides methods for data persistence
   - Handles synchronization between local and cloud storage

### Custom Hooks

Domain-specific hooks encapsulate business logic and data access:

1. **`useTeam`** (`/src/hooks/use-team.ts`)
   - Team CRUD operations
   - Team selection

2. **`usePlayers`** (`/src/hooks/use-players.ts`)
   - Player CRUD operations
   - Player filtering and searching

3. **`useGames`** (`/src/hooks/use-games.ts`)
   - Game CRUD operations
   - Game filtering and sorting

4. **`useLineup`** (`/src/hooks/use-lineup.ts`)
   - Lineup creation and editing
   - Position assignment and validation
   - Fair play metrics calculation

### State Flow

The typical state flow in the application:

1. User selects a team via Team Context
2. Component uses custom hooks to fetch/modify data
3. Hook methods interact with storage services
4. Storage services determine whether to use local or cloud storage
5. UI updates to reflect the changed state

## API Layer & Backend Integration

CompeteHQ uses Next.js API routes for backend functionality:

### API Structure

API routes follow RESTful patterns and are organized by resource:

- `/api/auth/...`: Authentication endpoints
- `/api/teams/...`: Team management endpoints
- `/api/teams/players/...`: Player management endpoints
- `/api/teams/[id]/games/...`: Game management endpoints
- `/api/lineups/...`: Lineup management endpoints
- `/api/upload/...`: File upload endpoints

### Data Storage Strategy

The application uses a MongoDB-only cloud storage approach:

1. **Cloud Storage (MongoDB)**
   - Primary and only data store
   - Provides consistent data across all devices
   - Enables multi-device access
   - Handles team collaboration
   - Centralizes data management
   - Enforces data validation on the server
   - Ensures all users see the same data in real-time

2. **API-First Architecture**
   - All data access flows through Next.js API routes
   - Structured RESTful API patterns for consistency
   - Proper error handling and status codes
   - Type-safe request and response handling

### Connection Management

- API routes check database connectivity before operations
- Client-side hooks show connection status and error states 
- Graceful error handling when database is unavailable
- Retry mechanisms for transient connectivity issues

## UI & Design System

CompeteHQ uses Chakra UI with custom theming for a consistent design system. Our design choices prioritize usability, clarity, and intuitive interactions.

### Design Principles & Philosophy

1. **Clean, Focused Interfaces**
   - Show only what's needed for the current task
   - Progressive disclosure of complex features
   - Visual hierarchy for important information
   - Minimize cognitive load during high-stress game situations
   - Use whitespace strategically to create breathing room

2. **Mobile-First Design**
   - Touch-friendly interface elements (minimum tap target size of 44x44px)
   - Responsive layouts for all screen sizes (from phone to tablet to desktop)
   - Field-optimized for outdoor use (high contrast, legible in sunlight)
   - Efficient thumb-zone design for one-handed phone operation
   - Minimize typing with selection controls and defaults

3. **Consistent Color Coding**
   - Position-specific colors (e.g., P=red, C=blue) for instant recognition
   - Status colors (green=active, yellow=warning, red=issue) for quick situation assessment
   - Fair play indicators (red-to-green gradients) showing equitable play distribution
   - Accessibility considerations with sufficient contrast ratios
   - Limited color palette to maintain visual cohesion

4. **Information Density Tradeoffs**
   - Table-based views for information-dense screens (roster, game list)
   - Card-based views for detailed information and content focus
   - Expandable/collapsible sections to manage complexity
   - Context-specific detail levels based on user needs
   - Balance between information availability and overwhelming users

### Key UI Components

1. **Layout Components**
   - PageContainer: Standard page wrapper with title, breadcrumbs, and actions
   - Card: Consistent card component for content blocks with standardized spacing
   - Tabs: Organized tab interfaces for sections with consistent styling
   - Table: Structured data display with consistent header styling and row interactions

2. **Domain-Specific Components**
   - PositionBadge: Visual representation of player positions with color coding
   - LineupGrid: Spreadsheet-style lineup editor with drag-and-drop functionality
   - PlayerTable: Efficient, scannable player listing with expandable details
   - FairPlayIndicator: Visual fair play metrics for quick assessment
   - LoadingSpinner: Consistent loading state with branded styling
   - StatCards: Standardized metrics display with title and value

### Key UI Patterns

1. **Navigation Patterns**
   - Breadcrumb trails for deep navigation paths
   - Back buttons for multi-step processes
   - Sidebar navigation for primary sections
   - Bottom navigation for mobile screens
   - Contextual actions based on current view

2. **Data Presentation Patterns**
   - Table-based views for efficient data scanning
   - Expandable rows for progressive disclosure
   - Filtering and search controls consistently positioned
   - Empty states with helpful guidance
   - Skeleton loaders for content anticipation

3. **Interactive Patterns**
   - Hover states for interactive elements
   - Click/tap targets with appropriate padding
   - Consistent button styling by action type
   - Modal confirmations for destructive actions
   - Toast notifications for operation feedback

### Color Scheme & Visual Identity

- **Primary**: Royal blue theme (#10417A) - chosen for its association with trust, stability, and professionalism
- **Secondary Accent**: Light blue (#4299E1) - for highlighting interactive elements
- **Positions**: Consistent colors for each position (allowing coaches to quickly identify positions)
- **Status**: Green (#38A169, success), Yellow (#D69E2E, warning), Red (#E53E3E, error)
- **Background**: Light gray (#F7FAFC) for app, white for content areas (creating a clean, focused environment)
- **Text**: Dark gray (#2D3748) for primary text, medium gray (#718096) for secondary text
- **Card Design**: Subtle shadows, rounded corners (8px radius), and consistent padding
- **Typography**: Sans-serif fonts prioritizing readability on all devices

### Recent UI Enhancements

1. **Roster View Improvements**
   - Replaced card-based player display with efficient table view
   - Added expandable rows for mobile screens to show position details
   - Implemented row-based interaction pattern for easier scanning
   - Side-by-side display of primary/secondary positions
   - Clickable player names for direct access to player details
   - Improved color-coded position badges for quick identification

2. **Game Dashboard Enhancements**
   - Implemented tabbed interface for upcoming vs. past games
   - Added better visual grouping of game information
   - Improved date and time formatting for readability
   - Enhanced game status visual indicators
   - Optimized mobile layout for on-field use

3. **Loading States**
   - Custom-designed loading spinner with brand colors
   - Consistent loading experience throughout the application
   - Appropriate loading state messaging
   - Skeleton loaders for content-heavy pages

## Authentication & User Management

CompeteHQ uses a custom JWT-based authentication system:

### Authentication Flow

1. User registers or logs in
2. Server validates credentials and issues JWT token
3. Token stored in HTTP-only cookie
4. Token included in subsequent requests
5. Server validates token on protected routes

### User Roles & Permissions

Users have roles with specific permissions:

1. **Head Coach**
   - Full administrative access
   - Create/edit teams, lineups, games
   - Manage team members

2. **Assistant Coach**
   - Create/edit lineups and games
   - View and edit roster
   - Limited team management

3. **Parent/Fan**
   - View schedules and lineups
   - Limited interaction with team data

### Team Membership

Team membership is managed through:
- Direct invitations to email addresses
- Join codes for quick access
- Join requests requiring approval

## Development Workflow

The development workflow follows these phases:

### Phase 1: Core MVP - Lineup Builder

- Simple team setup
- Grid-based lineup creator
- Basic position history tracking
- Local storage only (no accounts)

### Phase 2: Position Tracking & Fair Play

- Enhanced position tracking
- Fair play dashboard
- Intelligent lineup suggestions
- Visual indicators for development needs

### Phase 3: Team Management & Data Persistence

- User account system
- Multi-team support
- Cloud data synchronization
- Season tracking and analytics

### Phase 4: Practice Planning

- Practice plan generator
- Drill library
- Visual timeline
- Equipment management

### Phase 5: Advanced Features (Future)

- Game management and stats
- Field management
- Parent communication
- Organization administration

## Deployment

CompeteHQ is designed for deployment on Vercel:

### Deployment Process

1. Build the Next.js application
2. Deploy frontend to Vercel
3. Configure environment variables
4. Set up MongoDB Atlas for production database
5. Configure authentication settings
6. Set up monitoring and analytics

### Environment Variables

Key environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT tokens
- `NEXT_PUBLIC_APP_URL`: Public application URL
- Various API keys for third-party services

## Testing Strategy

CompeteHQ's testing approach includes:

### Unit Testing

- Test core utility functions
- Test data manipulation logic
- Test storage services

### Integration Testing

- Test lineup creation workflow
- Test data persistence
- Test position tracking calculations

### User Testing

- Identify 3-5 coaches for feedback
- Create specific testing scenarios
- Collect structured feedback on UX

## Development Roadmap

CompeteHQ has a phased development approach:

### Phase 1: Core MVP (Completed)
- Basic team/player management
- Simple lineup builder
- MongoDB database integration
- User authentication system

### Phase 2: Position Tracking (Completed)
- Enhanced position history
- Fair play dashboard
- Intelligent lineup suggestions
- MongoDB-based storage system

### Phase 3: Enhanced Team Management (Current)
- Multi-team support
- Team membership and roles
- Permission system enhancements
- Advanced data visualization

### Phase 4: Practice Planning (Upcoming)
- Practice plan generator
- Drill library
- Visual timeline
- Equipment management

### Phase 5+: Advanced Features (Planned)
- Game management and detailed stats
- Team communication
- Organization administration
- (Future consideration) Offline capabilities for field use

## Recent Architectural Enhancements

The application has undergone several important architectural improvements to enhance stability, performance, and user experience:

### 1. API-First Architecture

We've implemented an API-first approach for data access:
- Standardized API route handlers for all data operations
- Consistent error handling and response formatting
- Proper validation of request parameters
- Improved dynamic route parameter handling with type safety
- Enhanced MongoDB connection management

### 2. Improved Next.js Route Handlers

Fixed critical issues in dynamic route handlers:
- Updated route handlers to properly handle array params using pattern `Array.isArray(params.id) ? params.id[0] : params.id`
- Implemented proper error handling in API routes
- Ensured consistent response structures across all endpoints
- Added request validation for better security and data integrity

### 3. React Hydration Optimization

Addressed React hydration issues for improved performance and stability:
- Added `suppressHydrationWarning` for date-dependent components
- Ensured client/server rendering consistency
- Improved component rendering lifecycle
- Fixed context-related rendering issues

### 4. Progressive Enhancement Strategy

Implemented progressive enhancement for better user experience:
- Core functionality works without JavaScript
- Enhanced features gracefully enable with JS
- Improved error states and fallbacks
- Better offline capability handling

### 5. Responsive Design Refinements

Enhanced responsive design approach:
- Tailored experiences for phone, tablet, and desktop
- Table-based views for information-dense screens
- Card-based views for detail-focused screens
- Expandable content for mobile optimization

## Common Issues & Troubleshooting

### Database Connectivity Issues

- Check MongoDB connection string format and credentials
- Verify network connectivity and firewall settings
- Check MongoDB Atlas access settings and IP whitelisting
- Use `/api/debug` and `/api/mongodb` routes for diagnostics
- Check the MongoDB connection pool limits
- Verify MongoDB version compatibility
- Look for MongoDB connection errors in server logs

### Authentication Problems

- Clear cookies to reset session state
- Check for expired JWT tokens (default expiration is 24 hours)
- Verify correct email/password combination
- Reset password if needed through the reset flow
- Check for CORS issues if accessing from different domains
- Ensure HTTP-only cookie settings are correct
- Verify that the JWT_SECRET environment variable is set

### React and Next.js Issues

#### Hydration Errors
- Check for client/server rendering mismatches
- Use `suppressHydrationWarning` for dynamic content
- Move client-only rendering to useEffect hooks
- Ensure CSS-in-JS is properly configured

#### Route Handler Errors
- Ensure proper handling of dynamic route parameters 
- Always check if params.id is an array: `Array.isArray(params.id) ? params.id[0] : params.id`
- Use proper response status codes and formats
- Implement proper error boundaries

#### Component Context Errors
- Ensure components are used within proper context providers
- Verify context nesting order (especially with Chakra UI components)
- Check for missing provider wrappers
- Use proper component composition patterns (e.g., Stat/StatLabel)

### UI Rendering Issues

- Check for React key warnings in console
- Verify Chakra UI theme provider is properly configured
- Test responsive layouts on different devices and orientations
- Clear browser cache after significant UI changes
- Check for CSS conflicts or specificity issues
- Verify proper use of responsive Chakra breakpoints
- Test with different browsers for compatibility

### Database Connectivity Issues

- Check network connectivity to MongoDB
- Verify API routes are calling the correct endpoints
- Use browser developer tools to inspect network requests
- Check response status codes for API calls
- Verify MongoDB connection string in environment variables
- Ensure MongoDB Atlas IP access list includes your IP
- Check browser console for API or network errors
- Use the API status endpoints for diagnostics

### Performance Issues

- Use React DevTools profiler to identify slow components
- Check for excessive re-renders
- Implement proper memoization with useMemo and useCallback
- Optimize large lists with virtualization
- Lazy-load components and routes
- Ensure proper bundle splitting
- Monitor network request waterfalls

---

## Design Decisions & Tradeoffs

CompeteHQ's architecture reflects specific design decisions and tradeoffs to achieve the best balance of performance, user experience, and developer productivity:

### 1. Next.js App Router vs. Pages Router

**Decision**: We chose the Next.js App Router over Pages Router.

**Rationale**:
- Better support for React Server Components
- More efficient rendering and data loading patterns
- Improved route organization with nested folders
- Better code organization by feature/domain

**Tradeoffs**:
- Steeper learning curve and newer API
- Some patterns require custom implementations
- Less community examples compared to Pages Router

### 2. MongoDB vs. SQL Database

**Decision**: We chose MongoDB as our primary database.

**Rationale**:
- Schema flexibility for evolving data models
- Document structure matches our domain objects
- Better support for offline-first architecture
- Easier horizontal scaling for future growth

**Tradeoffs**:
- Less rigid data validation
- No built-in relations/foreign keys
- Potentially more complex queries for reporting
- Need for application-level validation

### 3. React Context vs. Redux

**Decision**: We use React Context + custom hooks instead of Redux.

**Rationale**:
- Simpler mental model for developers
- Less boilerplate code
- Better integration with React's lifecycle
- Sufficient for our application's complexity level

**Tradeoffs**:
- Less structured state updates
- Potential performance issues with large state
- No time-travel debugging
- Context splitting required for performance

### 4. Chakra UI vs. Other UI Libraries

**Decision**: We selected Chakra UI as our component library.

**Rationale**:
- Excellent accessibility support out of the box
- Consistent theming system
- Great responsive design utilities
- Component composition pattern fits our needs

**Tradeoffs**:
- Larger bundle size than minimal libraries
- Some customization requires deeper knowledge
- Less pre-built components than Material-UI
- Emotion dependency affects styling approach

### 5. Table vs. Card Layout for List Views

**Decision**: We switched from card-based to table-based layouts for list views.

**Rationale**:
- Better information density for data-heavy screens
- More efficient use of vertical space
- Easier scanning of many items
- More familiar pattern for comparing items

**Tradeoffs**:
- Less visual richness and personality
- Requires careful mobile adaptation
- Less space for contextual actions
- More structured data presentation required

### 6. Local Storage Strategy

**Decision**: We use IndexedDB for local storage with MongoDB sync.

**Rationale**:
- Better storage limits than localStorage
- Support for complex data structures
- Transaction support for data integrity
- Better performance for large datasets

**Tradeoffs**:
- More complex API than localStorage
- Browser compatibility considerations
- Requires careful sync implementation
- No built-in expiration mechanism

## Getting Started for New Developers

If you're new to the CompeteHQ project, follow these steps to get started:

1. **Clone the repository**
   ```
   git clone [repository-url]
   cd competehq
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with required variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start development server**
   ```
   npm run dev
   ```
   The server will start on port 3000 (or next available port if 3000 is in use)

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

6. **Create a test account**
   - Use the signup page to create an account
   - For development, email verification is bypassed
   - Create a test team to access all features

7. **Explore the codebase**
   Start with these key files:
   - `/src/app/page.tsx`: Main landing page
   - `/src/app/providers.tsx`: Application context providers
   - `/src/contexts/auth-context.tsx`: Authentication logic
   - `/src/hooks/use-players.ts`: Example of domain logic

8. **Review types and models**
   Understand data structures in `/src/types`:
   - `team.ts`: Team structure and relationships
   - `player.ts`: Player model and positions
   - `lineup.ts`: Lineup structure and assignments

9. **Understand project architecture**
   Key architectural concepts:
   - API-first data access via Next.js route handlers
   - Context-based state management
   - Component composition and reuse patterns
   - Responsive design implementation

10. **Test key workflows**
    - Create a team and add players
    - Create a game and associated lineup
    - Test both table and form views
    - Try the responsive views on different device sizes

11. **Development guidelines**
    - Follow existing code patterns and style
    - Use TypeScript for all new code
    - Write components with mobile-first approach
    - Test on multiple device sizes
    - Ensure accessibility compliance
    - Use Chakra UI components for consistency

## Position Tracking System

### Cloud-Based Reference System

The CompeteHQ position tracking system uses a MongoDB-based cloud storage approach with a reference-based architecture to efficiently track player positions across games:

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

### Cloud-Only Storage Approach

This application is designed as a purely cloud-based solution:

- **MongoDB as Single Source of Truth**: All data persists exclusively in MongoDB
- **Connected Experience**: Application operates in a connected environment
- **API-First Design**: All data access happens through API routes
- **Consistent Data**: Every user sees the same data in real-time
- **Central Validation**: Data validation happens on the server side

The application requires an active network connection to function properly. While the UI will load without connection, all data operations require connectivity to the MongoDB database.

### Data Flow & Management

1. **Raw Position Data Source**
   - The primary source of truth for position data remains in the game lineups
   - Each game's lineup contains inning-by-inning position assignments
   - This data is never duplicated, only referenced by the position history system

2. **Position History Updating Process**
   - After each game is created or updated:
     ```typescript
     // Update position history after game lineup changes
     async function updatePositionHistory(gameId: string, lineup: Lineup) {
       // Connect to MongoDB
       await connectMongoDB();
       
       // Get all players involved in this game
       const playerIds = getUniquePlayerIds(lineup);
       
       // For each player, update their position history
       for (const playerId of playerIds) {
         // Get existing history or create new one
         let history = await PositionHistoryModel.findOne({ 
           playerId, teamId: lineup.teamId, season 
         }) || createNewPositionHistory(playerId, lineup.teamId);
         
         // Add game to played games if not already there
         if (!history.gamesPlayed.includes(gameId)) {
           history.gamesPlayed.push(gameId);
         }
         
         // Recalculate all metrics
         history.metrics = await calculatePlayerMetrics(
           playerId, 
           history.gamesPlayed
         );
         
         // Update timestamp
         history.updatedAt = Date.now();
         
         // Save updated history to MongoDB
         await PositionHistoryModel.findOneAndUpdate(
           { playerId, teamId: lineup.teamId, season },
           history,
           { upsert: true }
         );
       }
     }
     ```

3. **Metrics Calculation**
   - The metrics are calculated by analyzing the actual lineup data from referenced games
   - This ensures metrics always reflect the most recent state of all games
   - Pre-computed metrics dramatically improve performance for the lineup generator

### Integration with Lineup Generator

The Game Lineup Creator uses position history to generate balanced lineups:

```typescript
// In game-lineup-generator.ts
export async function generateGameLineup(options: GameLineupGeneratorOptions): Promise<Lineup> {
  const {
    gameId,
    teamId,
    innings,
    players,
    fairPlaySettings
  } = options;
  
  // Get position history for all players from MongoDB
  const playerPositionHistory = await positionHistoryService.getTeamPositionHistories(teamId);
  
  // Extract the metrics we need for fair play decisions
  const playerMetrics = {};
  for (const player of players) {
    const history = playerPositionHistory.find(h => h.playerId === player.id);
    if (history) {
      playerMetrics[player.id] = {
        // Use appropriate time frame based on lineup type
        recent: options.lineupType === 'competitive' 
          ? history.metrics.last3Games 
          : history.metrics.last5Games,
        season: history.metrics.season
      };
    }
  }
  
  // Generate lineup using the metrics
  const lineup = createLineupStructure(teamId, gameId, innings);
  
  // Apply fair play rules using the metrics
  for (let inning = 1; inning <= innings; inning++) {
    const inningAssignments = generateInningAssignments(
      players,
      playerMetrics,
      inning,
      fairPlaySettings
    );
    
    lineup.innings[inning-1] = {
      inning,
      positions: inningAssignments
    };
  }
  
  return lineup;
}
```

### Position Metrics for Decision Making

The lineup generator uses these metrics to make fair play decisions:

1. **Bench Rotation**
   - Players with highest `benchPercentage` in recent games get priority for field positions
   - Players with lowest `benchPercentage` are considered for bench in current game

2. **Position Variety**
   - Players with low `varietyScore` get opportunities at positions they've played less
   - The system balances between position familiarity and development

3. **Position Needs**
   - Players flagged with `needsInfield: true` get priority for infield positions
   - Players flagged with `needsOutfield: true` get priority for outfield experience

4. **Bench Streak Prevention**
   - Players with high `benchStreak.current` get priority to avoid consecutive benching
   - The system breaks bench streaks before they become problematic

### Performance Considerations

This approach offers significant performance benefits:

1. **Reduced Data Duplication**
   - No duplicate storage of position data
   - Position data exists only in game lineups

2. **Pre-computed Metrics**
   - Calculated metrics dramatically reduce computation during lineup generation
   - O(1) access to key metrics instead of O(n³) calculations

3. **Optimized MongoDB Queries**
   - Indexes on `playerId`, `teamId`, and `season` fields
   - Compound indexes for common query patterns
   - Efficient storage through reference-based approach

4. **Scalable Architecture**
   - Position history grows linearly with players, not with innings or positions
   - MongoDB scales well for this type of data access pattern
   - System maintains performance even with many games and players

## Conclusion

### Project Vision

CompeteHQ is designed to solve real problems for youth baseball coaches through a carefully crafted user experience. The application prioritizes simplicity, usability, and fair play while providing powerful tools for team management. What sets CompeteHQ apart is its focus on:

1. **User-Centered Design**: Every feature is built with the coach's experience in mind, focusing on real-world usage scenarios like managing a lineup during a game or tracking player development over a season.

2. **Balance of Simplicity and Power**: The interface is intuitive enough for new coaches while providing depth for experienced coaches. Progressive disclosure of features ensures users aren't overwhelmed.

3. **Data-Driven Coaching**: By tracking position history, playing time, and development metrics, coaches can make more informed decisions that benefit all players.

4. **Technical Excellence**: The application leverages modern web technologies and best practices to create a reliable, performant experience across devices.

### Current State and Future Direction

As of the latest update, CompeteHQ has implemented:
- Complete team and player management
- Game scheduling and tracking
- Position-based lineup creation
- Table-based roster management with responsive design
- Initial fair play tracking metrics
- MongoDB integration for data persistence
- Improved UI/UX with focus on mobile usability
- Efficient position history tracking system

Future development will focus on:
- Advanced fair play analytics and visualizations
- AI-assisted lineup recommendations
- Practice planning and drill management
- Team communication features
- Season analytics and player development tracking
- League and multi-team management
- Performance optimization for low-bandwidth environments
- Expanded API capabilities for integration with other systems

### For Developers

The modular architecture makes it easy to extend the application with new features while keeping the codebase organized and maintainable. By following the patterns established in the existing code, new developers can quickly become productive contributors to the project.

Key priorities for ongoing development:
- Maintain strict TypeScript typing for code safety
- Prioritize accessibility for all users
- Ensure responsive design across all device sizes
- Write unit and integration tests for critical paths
- Follow the established design system for consistency
- Optimize for performance, especially on mobile devices
- Consider offline-first approach for all new features

### Final Thoughts

CompeteHQ represents more than just a team management tool—it's designed to promote fair play, player development, and positive coaching experiences. By focusing on these core values while delivering technical excellence, the application aims to make a meaningful impact on youth baseball coaching.

As the project evolves, maintaining the balance between simplicity and power will be crucial. Every new feature should uphold the core principle: to help coaches focus more on coaching and player development, and less on administrative tasks and lineup management.