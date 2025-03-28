# End-to-End Testing Plan for CompeteHQ

This document outlines a comprehensive end-to-end testing plan for the CompeteHQ application.

## 1. Authentication Flows

### 1.1 User Registration
- [ ] Navigate to `/signup`
- [ ] Submit form without filling all required fields ➝ Should show validation errors
- [ ] Enter a valid email but mismatched passwords ➝ Should show password mismatch error
- [ ] Enter valid information and submit ➝ Should create account and redirect to team creation
- [ ] Try registering with an already used email ➝ Should show email already in use error

### 1.2 User Login
- [ ] Navigate to `/login`
- [ ] Submit form with invalid credentials ➝ Should show invalid credentials error
- [ ] Submit form with valid credentials ➝ Should log in and redirect to dashboard
- [ ] Check "Remember me" and log in ➝ Session should persist after browser restart

### 1.3 Logout
- [ ] Click logout in user menu ➝ Should log out and redirect to login page
- [ ] Try accessing protected route after logout ➝ Should redirect to login page

### 1.4 Password Reset
- [ ] Navigate to `/login` and click "Forgot password"
- [ ] Enter valid email and submit ➝ Should show confirmation message
- [ ] Check for received email (manual test)
- [ ] Click reset link in email ➝ Should navigate to reset password page
- [ ] Set new password ➝ Should update password and allow login with new password

## 2. Team Management Flows

### 2.1 Team Creation
- [ ] Navigate to `/teams/new`
- [ ] Submit form without filling required fields ➝ Should show validation errors
- [ ] Fill out team form with valid data and submit ➝ Should create team and redirect to team page
- [ ] Verify team code is generated ➝ Team code should appear in team details

### 2.2 Team Joining
- [ ] Log in as a different user
- [ ] Navigate to `/teams/join`
- [ ] Enter invalid team code ➝ Should show invalid code error
- [ ] Enter valid team code ➝ Should join team and redirect to team page

### 2.3 Team Switching
- [ ] Create multiple teams or join multiple teams
- [ ] Click team dropdown in header
- [ ] Select a different team ➝ Should switch to that team and update UI accordingly
- [ ] Verify that player roster and other team-specific data updates

### 2.4 Team Editing
- [ ] Navigate to team details page
- [ ] Click edit team
- [ ] Update team information ➝ Should save changes and update UI

## 3. Player Management Flows

### 3.1 Player Creation
- [ ] Navigate to `/roster/new`
- [ ] Submit form without required fields ➝ Should show validation errors
- [ ] Fill out player form with valid data and submit ➝ Should create player and redirect to roster page
- [ ] Create player with duplicate jersey number ➝ Should show warning or handle appropriately
- [ ] Verify newly created player appears in roster list
- [ ] Verify player data is saved to MongoDB (check MongoDB directly)

### 3.2 Player Editing
- [ ] Navigate to player details page
- [ ] Click edit player
- [ ] Update player information ➝ Should save changes and update UI
- [ ] Verify changes are saved to MongoDB

### 3.3 Player Deletion
- [ ] Navigate to player details page
- [ ] Click delete player
- [ ] Confirm deletion ➝ Should delete player and redirect to roster page
- [ ] Verify player no longer appears in roster list
- [ ] Verify player is removed from MongoDB

## 4. Game Management Flows

### 4.1 Game Creation
- [ ] Navigate to `/games/new`
- [ ] Submit form without required fields ➝ Should show validation errors
- [ ] Fill out game form with valid data and submit ➝ Should create game and redirect to games page
- [ ] Verify game appears in games list
- [ ] Verify game data is saved to MongoDB

### 4.2 Game Editing
- [ ] Navigate to game details page
- [ ] Click edit game
- [ ] Update game information ➝ Should save changes and update UI
- [ ] Verify changes are saved to MongoDB

### 4.3 Game Status Management
- [ ] Create a new game with "Scheduled" status
- [ ] Change status to "In Progress" ➝ Should update status and enable scoring
- [ ] Change status to "Completed" ➝ Should finalize game and update record

## 5. Lineup Management Flows

### 5.1 Lineup Creation
- [ ] Navigate to game that doesn't have a lineup
- [ ] Click "Create Lineup" button
- [ ] Assign players to positions for each inning ➝ Should allow drag and drop or selection
- [ ] Try creating a lineup that doesn't meet fair play rules ➝ Should show warning
- [ ] Save lineup ➝ Should save lineup and associate with game
- [ ] Verify lineup is saved to MongoDB

### 5.2 Lineup Editing
- [ ] Navigate to existing lineup
- [ ] Make changes to player positions
- [ ] Save changes ➝ Should update lineup and reflect changes in UI
- [ ] Verify changes are saved to MongoDB

### 5.3 Fair Play Checking
- [ ] Create a lineup where some players play significantly more than others
- [ ] Check fair play indicator ➝ Should show warnings for unfair distribution
- [ ] Balance playing time and recheck ➝ Should show improved fair play score

## 6. System Integration Tests

### 6.1 Online/Offline Functionality
- [ ] Use the application while online
- [ ] Disable network connection
- [ ] Continue using application ➝ Should continue to function with local data
- [ ] Re-enable network connection
- [ ] Check that data syncs to MongoDB

### 6.2 Permission-Based Access Control
- [ ] Log in as head coach ➝ Should have access to all features
- [ ] Log in as assistant coach ➝ Should have restricted access based on permissions
- [ ] Log in as fan ➝ Should have very limited access
- [ ] Attempt to access restricted resources directly by URL ➝ Should redirect to error page

### 6.3 Mobile Responsiveness
- [ ] Test all key flows on mobile viewport
- [ ] Verify forms are usable on small screens
- [ ] Check that lineup builder works on mobile devices
- [ ] Verify navigation menu adapts to small screens

## 7. Edge Cases and Error Handling

### 7.1 Concurrent Editing
- [ ] Open same resource (player, team, game) in two different browsers
- [ ] Make changes in both browsers
- [ ] Save changes in both browsers ➝ Should handle conflicts gracefully

### 7.2 Error Recovery
- [ ] Interrupt form submission by disconnecting network
- [ ] Verify appropriate error shown
- [ ] Reconnect and retry ➝ Should successfully complete operation

### 7.3 Invalid Data Handling
- [ ] Attempt to submit forms with edge case values (extremely long text, special characters)
- [ ] Verify validation correctly handles these cases
- [ ] Check MongoDB to ensure data integrity is maintained

## 8. Testing Environment

This testing should be performed in a testing or staging environment with the following configuration:
- MongoDB test database (separate from production)
- Test user accounts with various permission levels
- Controlled network access for testing offline functionality

## 9. Documentation of Results

For each test:
- [ ] Document whether the test passed or failed
- [ ] If failed, document the exact error and steps to reproduce
- [ ] Take screenshots of any UI issues
- [ ] Document any unexpected behavior, even if the test technically passed

## 10. Regression Testing

After fixing any issues:
- [ ] Rerun all failed tests
- [ ] Rerun a sample of previously passing tests to ensure no regressions

## 11. Performance Testing

- [ ] Test with a large number of players (50+)
- [ ] Test with a large number of games (20+)
- [ ] Test with multiple teams (5+)
- [ ] Measure page load times and server response times