# MongoDB Setup for CompeteHQ

This document provides instructions for setting up MongoDB for the CompeteHQ baseball coach app.

## Overview

CompeteHQ uses MongoDB as its primary database with a hybrid approach that supports:

1. **Online Mode**: Data is stored in MongoDB Atlas (cloud-based)
2. **Offline Mode**: Data is cached in the browser's LocalStorage for offline access
3. **Sync Mechanism**: Data is synchronized between LocalStorage and MongoDB when going online

## MongoDB Atlas Setup

1. **Create a MongoDB Atlas Account**:
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create an account or log in
   - Create a new project named "CompeteHQ"

2. **Create a Cluster**:
   - Create a shared cluster (free tier is sufficient for development)
   - Choose a cloud provider and region close to your users
   - Name your cluster "competehq-cluster"

3. **Configure Database Access**:
   - Go to "Database Access" and create a new database user
   - Use a strong password and note it down
   - Set appropriate access permissions (readWrite to the competehq database)

4. **Configure Network Access**:
   - Go to "Network Access" and add your IP address
   - For development, you can allow access from anywhere (0.0.0.0/0)
   - For production, restrict to your application server IPs

5. **Get Connection String**:
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

6. **Update Environment Variables**:
   - Open the `.env` file in your project
   - Replace the placeholder MongoDB URI with your connection string:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/competehq?retryWrites=true&w=majority
   ```
   - Replace `your-username` and `your-password` with your actual credentials

## Local Development with MongoDB

For local development, you have two options:

### Option 1: Continue using MongoDB Atlas

This is the simplest approach, but requires an internet connection.

### Option 2: Run MongoDB Locally with Docker

1. **Start MongoDB with Docker**:
   ```bash
   docker run --name mongodb -p 27017:27017 -d mongo:latest
   ```

2. **Update Environment Variables for Local Development**:
   ```
   MONGODB_URI=mongodb://localhost:27017/competehq
   ```

## Database Collections

The application uses the following collections:

1. **users** - User accounts
2. **teams** - Baseball teams 
3. **teamMemberships** - Relationships between users and teams
4. **players** - Team roster players
5. **games** - Scheduled games
6. **lineups** - Player lineups for specific games
7. **practices** - Team practices
8. **positionHistories** - Historical position data for players
9. **notifications** - User notifications
10. **invitations** - Team join invitations
11. **teamCodes** - Codes for joining teams

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env` with real credentials to version control
   - Use environment variables in production deployments

2. **Access Control**:
   - The application implements a permission-based system
   - Regular backups are recommended

3. **Data Validation**:
   - All data is validated using Mongoose schemas before storage

## Offline/Online Sync Strategy

The application implements a "local-first" strategy:

1. All writes go to LocalStorage first
2. When online, data is synced to MongoDB
3. If conflicts occur, the most recent version wins

## Troubleshooting

If you encounter connection issues:

1. Verify your MongoDB connection string
2. Check network access settings in MongoDB Atlas
3. Ensure your IP address is whitelisted
4. Confirm database user has appropriate permissions

## Next Steps

1. Run `npm install` to install MongoDB dependencies
2. Update your `.env` file with your MongoDB connection string
3. Run the application with `npm run dev`