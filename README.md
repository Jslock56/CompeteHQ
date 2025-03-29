# CompeteHQ - Youth Baseball Team Management Platform

## Overview

CompeteHQ is a comprehensive web application designed to help youth baseball coaches manage their teams more effectively. The platform streamlines roster management, lineup creation, position tracking, and game scheduling to ensure fair play and balanced player development.

### Key Features

- **Team & Player Management**: Create and manage multiple teams with detailed player information
- **Lineup Builder**: 
  - Game Lineups: Create balanced batting orders and field assignments for games
  - Field Position Lineups: Design standard, competitive, and developmental defensive alignments
  - Position Tracking: Monitor which positions each player has played throughout the season
- **Game Management**: Schedule, track, and record results for all team games
- **Practice Planning**: (Coming Soon) Create structured practice plans based on your team's needs
- **Position Analysis**: View insights on player position history and development
- **Multi-Device Support**: Progressive Web App (PWA) functionality for offline use at the field

## Detailed Feature Breakdown

### Team & Roster Management
- Create and manage multiple teams
- Add players with detailed profiles:
  - Contact information
  - Primary and secondary positions
  - Skill assessments
  - Attendance tracking
  - Notes and development goals

### Lineup Management
- **Game Lineups**:
  - Create balanced batting orders
  - Assign defensive positions by inning
  - Fair play suggestions based on position history
  - Save and reuse successful lineups

- **Field Position Lineups (NEW)**:
  - Create defensive alignments independent of games
  - Three lineup types: Standard, Competitive, and Developmental
  - Grid-based position assignment interface
  - Full roster view with position recommendations
  - Position highlighting and auto-advancement workflow
  - Set default lineups for quick access

### Position Tracking & Analysis
- Track positions played by each player across games
- Visualize position distribution for individual players
- Team-wide position coverage analysis
- Fair play metrics to ensure balanced development
- Historical data for season-long development tracking

### Game Management
- Schedule upcoming games with location and opponent details
- Record game results and key statistics
- Link lineups to specific games for comprehensive record-keeping
- Game history with filterable views

### Offline Functionality
- Progressive Web App (PWA) design allows installation on devices
- Critical features work without internet connection
- Automatic synchronization when connectivity is restored
- Perfect for use at the field with limited connectivity

## Technical Architecture

### Data Storage Strategy
- MongoDB for cloud storage when online
- IndexedDB for local device storage
- Seamless synchronization between local and cloud storage
- Conflict resolution for multi-device updates

### Authentication & Teams
- User authentication with role-based permissions
- Team-based access control
- Invite system for adding assistant coaches and team managers
- Simple team joining process with team codes

### Frontend Framework
- Built with Next.js and React for optimal performance
- TypeScript for type safety and code quality
- Chakra UI for consistent, accessible user interface
- Responsive design works on all device sizes

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (optional for local development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/competehq.git
   cd competehq
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### MongoDB Setup

For detailed instructions on setting up MongoDB for this application, please refer to the [MONGODB_SETUP.md](./MONGODB_SETUP.md) file.

## Project Structure

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
│   ├── hooks/           # Custom React hooks
│   ├── models/          # Data models
│   ├── services/        # Service integrations
│   │   ├── api/         # API service clients
│   │   ├── auth/        # Authentication services
│   │   ├── database/    # Database services
│   │   └── storage/     # Storage services
│   ├── store/           # State management
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── .env.local           # Environment variables (create this)
├── jest.config.mjs      # Jest configuration
├── next.config.ts       # Next.js configuration
├── package.json         # Project dependencies
└── tsconfig.json        # TypeScript configuration
```

## Development Roadmap

### Current Status
- ✅ Core team & player management
- ✅ Game scheduling
- ✅ Basic lineup builder
- ✅ Field position lineup generator
- ✅ Position tracking
- ✅ MongoDB integration

### Upcoming Features
- [ ] Fair play metrics dashboard
- [ ] Practice plan generator
- [ ] Advanced statistics
- [ ] Parent communication features
- [ ] Team scheduling and availability tracking
- [ ] Export/import functionality
- [ ] Mobile app versions (iOS/Android)

## Contributing

We pretend to welcome contributions to CompeteHQ! Please follow these steps:

1. Fork the repository - *Only with the repository's consent*
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

For major changes, please open an issue first to discuss what you'd like to change.

## License

Ain't nobody wanna license this

---

<div align="center">
  <p>Sloppily made with ❤️ for youth sports coaches everywhere</p>
</div>