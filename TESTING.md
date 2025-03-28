# CompeteHQ Testing Guide

This document provides comprehensive instructions for testing the CompeteHQ application before deployment.

## Prerequisites

Before running tests, ensure you have:

1. Node.js (v18 or later) installed
2. MongoDB instance running
3. `.env` file configured with appropriate variables:
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret for authentication tokens
   - `NODE_ENV`: Set to "test" for testing

## Test Documents

We've created several testing documents:

1. **END_TO_END_TESTING.md**: Detailed test cases for all application features
2. **TEST_SCRIPTS.md**: Step-by-step manual test scripts
3. **DATABASE_VALIDATION.md**: MongoDB schema validation checklist

## Running Tests

### 1. Automated Unit Tests

Run the Jest test suite:

```bash
npm test
```

To watch for changes:

```bash
npm run test:watch
```

### 2. API Integration Tests

Run API integration tests (requires MongoDB connection):

```bash
npm run test:api
```

These tests validate the backend API endpoints and their interactions.

### 3. Database Validation

Validate MongoDB schema and data integrity:

```bash
npm run test:db
```

This checks for schema compliance, relationships, and data quality.

### 4. End-to-End Testing

Run the complete end-to-end test suite:

```bash
npm run test:e2e
```

This combines API tests and database validation.

### 5. Manual Testing

For thorough manual testing, follow the scripts in `TEST_SCRIPTS.md`. These cover:

- Authentication flows
- Team management
- Player roster
- Game scheduling
- Lineup creation
- Permission-based access

## Mobile Testing

Test the application on mobile devices or device emulators to ensure responsive design works correctly:

1. Use Chrome DevTools device mode
2. Test on both iOS and Android devices if possible
3. Check all critical flows work on smaller screens

## Performance Testing

For performance testing:

1. Create multiple teams (5+)
2. Add many players to teams (50+ per team)
3. Create multiple games (20+)
4. Monitor page load times and API response times
5. Check MongoDB query performance

## Offline Testing

To test offline functionality:

1. Use the browser's developer tools to simulate offline mode
2. Create and edit data while offline
3. Reconnect and verify data syncs correctly

## Pre-Deployment Checklist

Before deploying to production:

- [x] All unit tests pass
- [ ] All API endpoints function correctly
- [ ] Database schema is validated
- [ ] Manual test scripts completed successfully
- [ ] Mobile responsiveness verified
- [ ] Performance is acceptable with large data sets
- [ ] Offline functionality works as expected
- [ ] Error handling is robust
- [ ] Authentication and permissions are secure

## Reporting Issues

When reporting issues:

1. Provide detailed steps to reproduce
2. Include relevant error messages
3. Note the browser/device used
4. Capture screenshots if applicable

## Continuous Integration

For future development, consider setting up CI/CD pipelines with:

- GitHub Actions
- Jest for unit tests
- Cypress for E2E tests
- MongoDB validation scripts
- Automated deployment to staging

## Security Testing

Security testing should include:

- Authentication bypass attempts
- Permission escalation tests
- Data validation and sanitization
- CSRF protection
- XSS prevention