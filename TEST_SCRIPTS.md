# Manual Test Scripts for CompeteHQ

This document provides step-by-step test scripts that can be executed manually to verify all critical user flows.

## Prerequisites

1. A clean test environment with the application running
2. MongoDB connected and accessible
3. Access to at least 2 different browsers (for multi-user testing)
4. Network that can be toggled on/off for offline testing

## Test User Information

To streamline testing, use these predefined test accounts:

- **Head Coach:** coach@example.com / Test123!
- **Assistant Coach:** assistant@example.com / Test123!
- **Team Fan:** fan@example.com / Test123!

## Test Script 1: Basic Authentication Flow

1. **Registration:**
   ```
   1. Navigate to /signup
   2. Enter: Name="Test User", Email="testuser@example.com", Password="Test123!", Confirm="Test123!"
   3. Click "Sign Up"
   4. EXPECTED: Redirected to team creation or dashboard
   ```

2. **Logout:**
   ```
   1. Click user avatar in top-right
   2. Click "Logout"
   3. EXPECTED: Redirected to login page
   ```

3. **Login:**
   ```
   1. Navigate to /login
   2. Enter: Email="testuser@example.com", Password="Test123!"
   3. Click "Log In"
   4. EXPECTED: Redirected to dashboard
   ```

## Test Script 2: Team Management Flow

1. **Team Creation:**
   ```
   1. Ensure you're logged in
   2. Navigate to /teams/new
   3. Enter: Name="Test Tigers", Age Group="12U", Season="Spring 2025", Description="Test team"
   4. Click "Create Team"
   5. EXPECTED: Team created, redirected to team dashboard
   6. VERIFY: Copy and save team code displayed for later use
   7. VERIFY IN MONGODB: Team document created, team code document created
   ```

2. **Team Switching:**
   ```
   1. Create a second team following steps in "Team Creation" but use Name="Test Eagles"
   2. Once both teams exist, click the team name in header dropdown
   3. Select "Test Tigers"
   4. EXPECTED: UI updates to show Test Tigers context
   5. Click team name again and select "Test Eagles"
   6. EXPECTED: UI updates to show Test Eagles context
   7. VERIFY: Player lists and team data changes accordingly
   ```

3. **Team Joining:**
   ```
   1. Open a different browser
   2. Register a new user or login with fan@example.com
   3. Navigate to /teams/join
   4. Enter the team code saved from Test Script 2.1
   5. Click "Join Team"
   6. EXPECTED: Successfully joined team, redirected to team page
   7. VERIFY IN MONGODB: User has new team in their teams array
   ```

## Test Script 3: Player Management Flow

1. **Player Creation:**
   ```
   1. Ensure you're logged in as a head coach
   2. Navigate to /roster/new
   3. Enter: Name="John Smith", Jersey="#25"
   4. Select Primary Positions: "Pitcher, First Base"
   5. Select Secondary Positions: "Outfield"
   6. Click "Create Player"
   7. EXPECTED: Player created, redirected to roster page
   8. VERIFY: Player appears in roster list
   9. VERIFY IN MONGODB: Player document created
   ```

2. **Player Editing:**
   ```
   1. In roster view, find "John Smith"
   2. Click the player or edit button
   3. Change name to "John Johnson"
   4. Change jersey number to "26"
   5. Update positions
   6. Click "Update Player"
   7. EXPECTED: Changes saved, UI updated
   8. VERIFY IN MONGODB: Player document updated
   ```

3. **Player Deletion:**
   ```
   1. Create a test player "Delete Me"
   2. Navigate to that player's details
   3. Click "Delete Player" button
   4. Confirm deletion if prompted
   5. EXPECTED: Player removed, redirected to roster
   6. VERIFY: Player no longer appears
   7. VERIFY IN MONGODB: Player document removed
   ```

## Test Script 4: Game Management Flow

1. **Game Creation:**
   ```
   1. Navigate to /games/new
   2. Enter: Opponent="Test Opponents", Location="Test Field"
   3. Set date to future date and time
   4. Set status to "Scheduled"
   5. Click "Create Game"
   6. EXPECTED: Game created, redirected to games list
   7. VERIFY: Game appears in list
   8. VERIFY IN MONGODB: Game document created
   ```

2. **Game Editing:**
   ```
   1. From games list, click a game
   2. Click "Edit Game"
   3. Change opponent to "Updated Opponents"
   4. Change status to "In Progress"
   5. Click "Update Game"
   6. EXPECTED: Changes saved, UI updated
   7. VERIFY IN MONGODB: Game document updated
   ```

## Test Script 5: Lineup Management Flow

1. **Lineup Creation:**
   ```
   1. Create at least 9 players on your team
   2. Navigate to a game without a lineup
   3. Click "Create Lineup" button
   4. For Inning 1, assign players to all field positions
   5. Click "Copy to Next Inning"
   6. Make some changes to Inning 2 positions
   7. Click "Save Lineup"
   8. EXPECTED: Lineup saved, lineup view displayed
   9. VERIFY: Positions match what was set
   10. VERIFY IN MONGODB: Lineup document created, linked to game
   ```

2. **Fair Play Testing:**
   ```
   1. Create a lineup where some players play significantly more innings than others
   2. Check the fair play indicator
   3. EXPECTED: Warnings about uneven playing time
   4. Adjust to make playing time more even
   5. EXPECTED: Fair play indicator improves
   ```

## Test Script 6: Offline Functionality

1. **Offline Data Creation:**
   ```
   1. Ensure you're online and logged in
   2. Disable network connection (turn off WiFi or disconnect)
   3. Navigate to /roster/new
   4. Create a new player "Offline Player"
   5. EXPECTED: Player creation works, appears in roster
   6. VERIFY: No error messages about connectivity
   ```

2. **Reconnection Sync:**
   ```
   1. While still offline with "Offline Player" created
   2. Re-enable network connection
   3. Navigate to another page and back to roster
   4. EXPECTED: "Offline Player" remains in list
   5. VERIFY IN MONGODB: Player document exists after reconnection
   ```

## Test Script 7: Permission-Based Access

1. **Permission Testing:**
   ```
   1. Create a team with head coach account
   2. Invite assistant and fan accounts
   3. Log in as assistant coach
   4. Verify can view players but may have restricted editing
   5. Log in as fan
   6. EXPECTED: Very limited access, mostly view-only
   7. Attempt to access head-coach-only URL directly
   8. EXPECTED: Access denied or redirected
   ```

## Test Script 8: Cross-Browser Testing

1. **Multi-Browser Compatibility:**
   ```
   Execute Test Scripts 1-5 on:
   - Chrome
   - Firefox
   - Safari
   - Mobile browser (if possible)
   ```

## Test Script 9: Error Handling

1. **Form Error Handling:**
   ```
   1. Attempt to create player with no name
   2. EXPECTED: Validation error, form not submitted
   3. Submit very long text in fields
   4. EXPECTED: Either truncated or validation error
   5. Use special characters in names
   6. EXPECTED: Proper handling, no crashes
   ```

2. **API Error Handling:**
   ```
   1. During form submission, quickly disconnect network
   2. EXPECTED: Appropriate error message
   3. Reconnect and retry
   4. EXPECTED: Successful completion
   ```

## Test Script 10: Performance Testing

1. **Bulk Data Testing:**
   ```
   1. Create 30+ players on a team
   2. Create 15+ games
   3. Navigate around the application
   4. EXPECTED: Reasonable load times, no UI lag
   5. MEASURE: Note any pages that take >3 seconds to load
   ```

## Results Reporting

For each test script, document:
1. Pass/Fail result
2. Any unexpected behavior
3. Error messages encountered
4. Suggestions for improvement

## MongoDB Verification Commands

Use these commands in MongoDB shell to verify data:

```javascript
// Check user creation
db.users.findOne({email: "testuser@example.com"})

// Check team creation
db.teams.findOne({name: "Test Tigers"})

// Check team code creation
db.teamcodes.findOne({teamId: "<team_id_from_above>"})

// Check player creation
db.players.findOne({name: "John Smith"})

// Check lineup creation
db.lineups.findOne({gameId: "<game_id>"})
```