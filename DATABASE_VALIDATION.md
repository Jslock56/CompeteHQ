# MongoDB Schema Validation Checklist

This document provides a checklist to validate the MongoDB schema and data integrity in the CompeteHQ application.

## User Collection

### Schema Validation
- [ ] `id` (String): Unique identifier
- [ ] `email` (String): Valid email format, unique index
- [ ] `passwordHash` (String): Properly hashed password (bcrypt)
- [ ] `name` (String): User's full name
- [ ] `firstName` (String, optional): User's first name
- [ ] `lastName` (String, optional): User's last name
- [ ] `teams` (Array of Strings): List of team IDs user belongs to
- [ ] `activeTeamId` (String, optional): Currently selected team
- [ ] `createdAt` (Number): Unix timestamp
- [ ] `lastLogin` (Number, optional): Unix timestamp of last login
- [ ] `isEmailVerified` (Boolean): Email verification status
- [ ] `verificationToken` (String, optional): For email verification
- [ ] `resetPasswordToken` (String, optional): For password reset
- [ ] `resetPasswordExpires` (Number, optional): Token expiration

### Validation Queries
```javascript
// Check for duplicate emails (should return 0)
db.users.aggregate([
  { $group: { _id: "$email", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for users without required fields
db.users.find({ $or: [
  { email: { $exists: false } },
  { passwordHash: { $exists: false } },
  { name: { $exists: false } },
  { teams: { $exists: false } },
  { createdAt: { $exists: false } }
]})

// Check for users with invalid email format
db.users.find({ email: { $not: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } })
```

## Team Collection

### Schema Validation
- [ ] `id` (String): Unique identifier
- [ ] `name` (String): Team name
- [ ] `ageGroup` (String): Age category (e.g., "12U")
- [ ] `season` (String): Season identifier
- [ ] `description` (String, optional): Team description
- [ ] `createdAt` (Number): Unix timestamp
- [ ] `updatedAt` (Number): Unix timestamp
- [ ] `createdBy` (String): User ID of creator
- [ ] `joinRequiresApproval` (Boolean): Whether join requests need approval
- [ ] `isPublic` (Boolean): Team visibility

### Validation Queries
```javascript
// Check for duplicate team IDs (should return 0)
db.teams.aggregate([
  { $group: { _id: "$id", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for teams without required fields
db.teams.find({ $or: [
  { id: { $exists: false } },
  { name: { $exists: false } },
  { ageGroup: { $exists: false } },
  { season: { $exists: false } },
  { createdAt: { $exists: false } },
  { updatedAt: { $exists: false } },
  { createdBy: { $exists: false } }
]})

// Check for teams with non-existent creators
db.teams.find({
  createdBy: { $nin: db.users.distinct("_id") }
})
```

## TeamCode Collection

### Schema Validation
- [ ] `teamId` (String): Team the code is for
- [ ] `code` (String): Unique join code
- [ ] `createdAt` (Number): Unix timestamp
- [ ] `expiresAt` (Number): Unix timestamp for expiration
- [ ] `maxUses` (Number, optional): Maximum number of uses
- [ ] `uses` (Number): Current use count
- [ ] `createdBy` (String): User ID of creator
- [ ] `isActive` (Boolean): Whether code is still active

### Validation Queries
```javascript
// Check for duplicate codes (should return 0)
db.teamcodes.aggregate([
  { $group: { _id: "$code", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for team codes without required fields
db.teamcodes.find({ $or: [
  { teamId: { $exists: false } },
  { code: { $exists: false } },
  { createdAt: { $exists: false } },
  { expiresAt: { $exists: false } },
  { uses: { $exists: false } },
  { createdBy: { $exists: false } },
  { isActive: { $exists: false } }
]})

// Check for team codes with non-existent teams
db.teamcodes.find({
  teamId: { $nin: db.teams.distinct("id") }
})
```

## TeamMembership Collection

### Schema Validation
- [ ] `userId` (String): User ID
- [ ] `teamId` (String): Team ID
- [ ] `role` (String): Role in team (headCoach, assistant, fan)
- [ ] `permissions` (Array of Strings): Specific permissions
- [ ] `status` (String): Membership status (active, pending, inactive)
- [ ] `joinedAt` (Number, optional): Unix timestamp when approved
- [ ] `invitedBy` (String, optional): User ID who invited this member

### Validation Queries
```javascript
// Check for duplicate memberships (should return 0)
db.teammemberships.aggregate([
  { $group: { _id: { userId: "$userId", teamId: "$teamId" }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for memberships without required fields
db.teammemberships.find({ $or: [
  { userId: { $exists: false } },
  { teamId: { $exists: false } },
  { role: { $exists: false } },
  { permissions: { $exists: false } },
  { status: { $exists: false } }
]})

// Check for memberships with invalid roles
db.teammemberships.find({
  role: { $nin: ["headCoach", "assistant", "fan"] }
})

// Check for memberships with non-existent users or teams
db.teammemberships.find({
  $or: [
    { userId: { $nin: db.users.distinct("_id") } },
    { teamId: { $nin: db.teams.distinct("id") } }
  ]
})
```

## Player Collection

### Schema Validation
- [ ] `id` (String): Unique identifier
- [ ] `teamId` (String): Team the player belongs to
- [ ] `name` (String): Player's name
- [ ] `jerseyNumber` (String, optional): Jersey number
- [ ] `primaryPositions` (Array of Strings): Main positions
- [ ] `secondaryPositions` (Array of Strings): Backup positions
- [ ] `notes` (String, optional): Additional notes
- [ ] `active` (Boolean): Whether player is active
- [ ] `createdAt` (Number): Unix timestamp
- [ ] `updatedAt` (Number): Unix timestamp

### Validation Queries
```javascript
// Check for duplicate player IDs (should return 0)
db.players.aggregate([
  { $group: { _id: "$id", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for players without required fields
db.players.find({ $or: [
  { id: { $exists: false } },
  { teamId: { $exists: false } },
  { name: { $exists: false } },
  { primaryPositions: { $exists: false } },
  { createdAt: { $exists: false } },
  { updatedAt: { $exists: false } }
]})

// Check for players with non-existent teams
db.players.find({
  teamId: { $nin: db.teams.distinct("id") }
})
```

## Game Collection

### Schema Validation
- [ ] `id` (String): Unique identifier
- [ ] `teamId` (String): Team the game belongs to
- [ ] `opponent` (String): Opposing team name
- [ ] `date` (Number): Unix timestamp of game date
- [ ] `location` (String, optional): Game location
- [ ] `status` (String): Game status (scheduled, inProgress, completed, canceled)
- [ ] `lineupId` (String, optional): Associated lineup
- [ ] `createdAt` (Number): Unix timestamp
- [ ] `updatedAt` (Number): Unix timestamp

### Validation Queries
```javascript
// Check for duplicate game IDs (should return 0)
db.games.aggregate([
  { $group: { _id: "$id", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for games without required fields
db.games.find({ $or: [
  { id: { $exists: false } },
  { teamId: { $exists: false } },
  { opponent: { $exists: false } },
  { date: { $exists: false } },
  { status: { $exists: false } },
  { createdAt: { $exists: false } },
  { updatedAt: { $exists: false } }
]})

// Check for games with invalid status
db.games.find({
  status: { $nin: ["scheduled", "inProgress", "completed", "canceled"] }
})

// Check for games with non-existent teams
db.games.find({
  teamId: { $nin: db.teams.distinct("id") }
})
```

## Lineup Collection

### Schema Validation
- [ ] `id` (String): Unique identifier
- [ ] `teamId` (String): Team the lineup belongs to
- [ ] `gameId` (String): Associated game
- [ ] `innings` (Array of Objects): Inning-by-inning positions
- [ ] `createdAt` (Number): Unix timestamp
- [ ] `updatedAt` (Number): Unix timestamp

### Validation Queries
```javascript
// Check for duplicate lineup IDs (should return 0)
db.lineups.aggregate([
  { $group: { _id: "$id", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Check for lineups without required fields
db.lineups.find({ $or: [
  { id: { $exists: false } },
  { teamId: { $exists: false } },
  { gameId: { $exists: false } },
  { innings: { $exists: false } },
  { createdAt: { $exists: false } },
  { updatedAt: { $exists: false } }
]})

// Check for lineups with non-existent teams or games
db.lineups.find({
  $or: [
    { teamId: { $nin: db.teams.distinct("id") } },
    { gameId: { $nin: db.games.distinct("id") } }
  ]
})
```

## Indexes Validation

Check that the following indexes exist:

- [ ] `users` collection: 
  - Index on `email` (unique)
  - Index on `teams`
  - Index on `verificationToken`
  - Index on `resetPasswordToken`

- [ ] `teams` collection:
  - Index on `id` (unique)
  - Index on `createdBy`

- [ ] `teamcodes` collection:
  - Index on `code` (unique)
  - Index on `teamId`
  - Index on `expiresAt`

- [ ] `teammemberships` collection:
  - Compound index on `userId` and `teamId` (unique)
  - Index on `teamId`
  - Index on `status`

- [ ] `players` collection:
  - Index on `id` (unique)
  - Index on `teamId`

- [ ] `games` collection:
  - Index on `id` (unique)
  - Index on `teamId`
  - Index on `date`

- [ ] `lineups` collection:
  - Index on `id` (unique)
  - Index on `teamId`
  - Index on `gameId`

## Relationships Validation

- [ ] All users referenced in `teams.createdBy` exist
- [ ] All teams referenced in `users.teams` exist
- [ ] All teams referenced in `players.teamId` exist
- [ ] All teams referenced in `games.teamId` exist
- [ ] All teams referenced in `lineups.teamId` exist
- [ ] All games referenced in `lineups.gameId` exist
- [ ] All lineups referenced in `games.lineupId` exist