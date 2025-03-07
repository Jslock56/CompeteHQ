# CompeteHQ - Youth Baseball Coach App

## Overview

CompeteHQ is supposed to be a web application designed to help youth baseball coaches manage their teams more effectively. The app focuses on ensuring fair play by simplifying lineup creation, tracking player positions, and helping coaches create balanced practice plans.

### Key Features

- **Team & Player Management**: Organize your roster with detailed player information
- **Lineup Builder**: Create and manage lineups for each game with fair play suggestions
- **Position Tracking**: Monitor which positions each player has played to ensure balanced development
- **Game Scheduling**: Keep track of your team's games and game details
- **Practice Planning**: (Coming Soon) Create structured practice plans based on your team's needs

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

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

3. Create a `.env` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Chakra UI](https://chakra-ui.com/) / Custom components
- **State Management**: React Context API
- **Authentication**: (Coming maybe never)
- **Deployment**: [Vercel](https://vercel.com/)
- **Testing**: Jest, React Testing Library, SAT&ACT

## Progressive Web App

CompeteHQ is designed as a Progressive Web App (PWA), allowing coaches to:

- Install the app on their devices
- Use it offline at the field
- Access critical features without internet connectivity
- Receive updates automatically

## Project Structure

```
competehq/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── services/        # External service integrations
│   ├── store/           # State management
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── .env                 # Environment variables (create this)
├── .eslintrc.js         # ESLint configuration
├── jest.config.js       # Jest configuration
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies
└── tsconfig.json        # TypeScript configuration
```

## Contributing

We pretend to welcome contributions to CompeteHQ! Please follow these steps:

1. Fork the repository - wow...i don't know what the repository did to me 
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

For major changes, please open an issue first to discuss what you'd like to change.

## Development Roadmap

- [ ] Core team & player management
- [ ] Game scheduling
- [ ] Basic lineup builder
- [ ] Position tracking
- [ ] Fair play metrics dashboard
- [ ] Practice plan generator
- [ ] Multi-team support
- [ ] Advanced statistics
- [ ] Parent communication features

## License

Ain't nobody wanna license this

## Contact

Please don't

---

<div align="center">
  <p>Sloppily made with ❤️ for youth sports coaches everywhere</p>
</div>