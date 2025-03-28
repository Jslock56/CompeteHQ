/**
 * MongoDB Schema Validation Tool
 * 
 * This script connects to MongoDB and runs validation queries to ensure
 * data integrity in the CompeteHQ application.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection string from environment
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'competehq';

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

// Connect to MongoDB
async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  await client.connect();
  return client.db(DB_NAME);
}

// Run all validation checks
async function validateDatabase() {
  console.log('🔍 Starting MongoDB Schema Validation');
  
  let client;
  try {
    // Connect to database
    client = await connectToMongoDB();
    console.log('✅ Connected to MongoDB');
    
    // Check collections exist
    const collections = await client.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = [
      'users',
      'teams',
      'teamcodes',
      'teammemberships',
      'players',
      'games',
      'lineups'
    ];
    
    console.log('\n--- Checking Required Collections ---');
    for (const collection of requiredCollections) {
      if (collectionNames.includes(collection)) {
        console.log(`✅ Collection exists: ${collection}`);
      } else {
        console.log(`❌ Missing collection: ${collection}`);
      }
    }
    
    // Run validation checks for each collection
    await validateUsers(client);
    await validateTeams(client);
    await validateTeamCodes(client);
    await validateTeamMemberships(client);
    await validatePlayers(client);
    await validateGames(client);
    await validateLineups(client);
    await validateRelationships(client);
    
    console.log('\n✅ Database validation complete!');
    
  } catch (error) {
    console.error('Error validating database:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('📡 MongoDB connection closed');
    }
  }
}

// Validate Users collection
async function validateUsers(db) {
  console.log('\n--- Validating Users Collection ---');
  
  // Count documents
  const count = await db.collection('users').countDocuments();
  console.log(`Total users: ${count}`);
  
  // Check for duplicate emails
  const duplicateEmails = await db.collection('users').aggregate([
    { $group: { _id: "$email", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  if (duplicateEmails.length > 0) {
    console.log(`❌ Found ${duplicateEmails.length} duplicate emails`);
  } else {
    console.log('✅ No duplicate emails found');
  }
  
  // Check for missing required fields
  const missingFields = await db.collection('users').find({ 
    $or: [
      { email: { $exists: false } },
      { passwordHash: { $exists: false } },
      { name: { $exists: false } },
      { teams: { $exists: false } },
      { createdAt: { $exists: false } }
    ]
  }).toArray();
  
  if (missingFields.length > 0) {
    console.log(`❌ Found ${missingFields.length} users with missing required fields`);
  } else {
    console.log('✅ All users have required fields');
  }
  
  // Check for invalid email format
  const invalidEmails = await db.collection('users').find({ 
    email: { $not: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } 
  }).toArray();
  
  if (invalidEmails.length > 0) {
    console.log(`❌ Found ${invalidEmails.length} users with invalid email format`);
  } else {
    console.log('✅ All user emails have valid format');
  }
}

// Validate Teams collection
async function validateTeams(db) {
  console.log('\n--- Validating Teams Collection ---');
  
  // Count documents
  const count = await db.collection('teams').countDocuments();
  console.log(`Total teams: ${count}`);
  
  // Check for duplicate team IDs
  const duplicateIds = await db.collection('teams').aggregate([
    { $group: { _id: "$id", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  if (duplicateIds.length > 0) {
    console.log(`❌ Found ${duplicateIds.length} duplicate team IDs`);
  } else {
    console.log('✅ No duplicate team IDs found');
  }
  
  // Check for missing required fields
  const missingFields = await db.collection('teams').find({ 
    $or: [
      { id: { $exists: false } },
      { name: { $exists: false } },
      { ageGroup: { $exists: false } },
      { season: { $exists: false } },
      { createdAt: { $exists: false } },
      { updatedAt: { $exists: false } },
      { createdBy: { $exists: false } }
    ]
  }).toArray();
  
  if (missingFields.length > 0) {
    console.log(`❌ Found ${missingFields.length} teams with missing required fields`);
  } else {
    console.log('✅ All teams have required fields');
  }
}

// Validate TeamCodes collection
async function validateTeamCodes(db) {
  console.log('\n--- Validating TeamCodes Collection ---');
  
  // Count documents
  const count = await db.collection('teamcodes').countDocuments();
  console.log(`Total team codes: ${count}`);
  
  // Check for duplicate codes
  const duplicateCodes = await db.collection('teamcodes').aggregate([
    { $group: { _id: "$code", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  if (duplicateCodes.length > 0) {
    console.log(`❌ Found ${duplicateCodes.length} duplicate team codes`);
  } else {
    console.log('✅ No duplicate team codes found');
  }
  
  // Check for missing required fields
  const missingFields = await db.collection('teamcodes').find({ 
    $or: [
      { teamId: { $exists: false } },
      { code: { $exists: false } },
      { createdAt: { $exists: false } },
      { expiresAt: { $exists: false } },
      { uses: { $exists: false } },
      { createdBy: { $exists: false } },
      { isActive: { $exists: false } }
    ]
  }).toArray();
  
  if (missingFields.length > 0) {
    console.log(`❌ Found ${missingFields.length} team codes with missing required fields`);
  } else {
    console.log('✅ All team codes have required fields');
  }
}

// Validate TeamMemberships collection
async function validateTeamMemberships(db) {
  console.log('\n--- Validating TeamMemberships Collection ---');
  
  // Count documents
  const count = await db.collection('teammemberships').countDocuments();
  console.log(`Total team memberships: ${count}`);
  
  // Check for duplicate memberships
  const duplicateMemberships = await db.collection('teammemberships').aggregate([
    { $group: { _id: { userId: "$userId", teamId: "$teamId" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  if (duplicateMemberships.length > 0) {
    console.log(`❌ Found ${duplicateMemberships.length} duplicate team memberships`);
  } else {
    console.log('✅ No duplicate team memberships found');
  }
  
  // Check for missing required fields
  const missingFields = await db.collection('teammemberships').find({ 
    $or: [
      { userId: { $exists: false } },
      { teamId: { $exists: false } },
      { role: { $exists: false } },
      { permissions: { $exists: false } },
      { status: { $exists: false } }
    ]
  }).toArray();
  
  if (missingFields.length > 0) {
    console.log(`❌ Found ${missingFields.length} team memberships with missing required fields`);
  } else {
    console.log('✅ All team memberships have required fields');
  }
  
  // Check for invalid roles
  const invalidRoles = await db.collection('teammemberships').find({
    role: { $nin: ["headCoach", "assistant", "fan"] }
  }).toArray();
  
  if (invalidRoles.length > 0) {
    console.log(`❌ Found ${invalidRoles.length} team memberships with invalid roles`);
  } else {
    console.log('✅ All team memberships have valid roles');
  }
}

// Validate Players collection
async function validatePlayers(db) {
  console.log('\n--- Validating Players Collection ---');
  
  // Count documents
  const count = await db.collection('players').countDocuments();
  console.log(`Total players: ${count}`);
  
  // Check for duplicate player IDs
  const duplicateIds = await db.collection('players').aggregate([
    { $group: { _id: "$id", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  if (duplicateIds.length > 0) {
    console.log(`❌ Found ${duplicateIds.length} duplicate player IDs`);
  } else {
    console.log('✅ No duplicate player IDs found');
  }
  
  // Check for missing required fields
  const missingFields = await db.collection('players').find({ 
    $or: [
      { id: { $exists: false } },
      { teamId: { $exists: false } },
      { name: { $exists: false } },
      { primaryPositions: { $exists: false } },
      { createdAt: { $exists: false } },
      { updatedAt: { $exists: false } }
    ]
  }).toArray();
  
  if (missingFields.length > 0) {
    console.log(`❌ Found ${missingFields.length} players with missing required fields`);
  } else {
    console.log('✅ All players have required fields');
  }
}

// Validate Games collection
async function validateGames(db) {
  console.log('\n--- Validating Games Collection ---');
  
  // Count documents
  const count = await db.collection('games').countDocuments();
  console.log(`Total games: ${count}`);
  
  // Check for duplicate game IDs
  const duplicateIds = await db.collection('games').aggregate([
    { $group: { _id: "$id", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  if (duplicateIds.length > 0) {
    console.log(`❌ Found ${duplicateIds.length} duplicate game IDs`);
  } else {
    console.log('✅ No duplicate game IDs found');
  }
  
  // Check for missing required fields
  const missingFields = await db.collection('games').find({ 
    $or: [
      { id: { $exists: false } },
      { teamId: { $exists: false } },
      { opponent: { $exists: false } },
      { date: { $exists: false } },
      { status: { $exists: false } },
      { createdAt: { $exists: false } },
      { updatedAt: { $exists: false } }
    ]
  }).toArray();
  
  if (missingFields.length > 0) {
    console.log(`❌ Found ${missingFields.length} games with missing required fields`);
  } else {
    console.log('✅ All games have required fields');
  }
  
  // Check for invalid status
  const invalidStatus = await db.collection('games').find({
    status: { $nin: ["scheduled", "inProgress", "completed", "canceled"] }
  }).toArray();
  
  if (invalidStatus.length > 0) {
    console.log(`❌ Found ${invalidStatus.length} games with invalid status`);
  } else {
    console.log('✅ All games have valid status');
  }
}

// Validate Lineups collection
async function validateLineups(db) {
  console.log('\n--- Validating Lineups Collection ---');
  
  // Count documents
  const count = await db.collection('lineups').countDocuments();
  console.log(`Total lineups: ${count}`);
  
  // Check for duplicate lineup IDs
  const duplicateIds = await db.collection('lineups').aggregate([
    { $group: { _id: "$id", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  
  if (duplicateIds.length > 0) {
    console.log(`❌ Found ${duplicateIds.length} duplicate lineup IDs`);
  } else {
    console.log('✅ No duplicate lineup IDs found');
  }
  
  // Check for missing required fields
  const missingFields = await db.collection('lineups').find({ 
    $or: [
      { id: { $exists: false } },
      { teamId: { $exists: false } },
      { gameId: { $exists: false } },
      { innings: { $exists: false } },
      { createdAt: { $exists: false } },
      { updatedAt: { $exists: false } }
    ]
  }).toArray();
  
  if (missingFields.length > 0) {
    console.log(`❌ Found ${missingFields.length} lineups with missing required fields`);
  } else {
    console.log('✅ All lineups have required fields');
  }
}

// Validate relationships between collections
async function validateRelationships(db) {
  console.log('\n--- Validating Collection Relationships ---');
  
  // Get distinct IDs for reference checks
  const userIds = await db.collection('users').distinct('_id');
  const teamIds = await db.collection('teams').distinct('id');
  const gameIds = await db.collection('games').distinct('id');
  
  // Check teams with non-existent creators
  const teamsWithInvalidCreators = await db.collection('teams').find({
    createdBy: { $nin: userIds }
  }).toArray();
  
  if (teamsWithInvalidCreators.length > 0) {
    console.log(`❌ Found ${teamsWithInvalidCreators.length} teams with non-existent creators`);
  } else {
    console.log('✅ All teams have valid creator references');
  }
  
  // Check team codes with non-existent teams
  const teamCodesWithInvalidTeams = await db.collection('teamcodes').find({
    teamId: { $nin: teamIds }
  }).toArray();
  
  if (teamCodesWithInvalidTeams.length > 0) {
    console.log(`❌ Found ${teamCodesWithInvalidTeams.length} team codes with non-existent teams`);
  } else {
    console.log('✅ All team codes have valid team references');
  }
  
  // Check memberships with non-existent users or teams
  const membershipsWithInvalidRefs = await db.collection('teammemberships').find({
    $or: [
      { userId: { $nin: userIds } },
      { teamId: { $nin: teamIds } }
    ]
  }).toArray();
  
  if (membershipsWithInvalidRefs.length > 0) {
    console.log(`❌ Found ${membershipsWithInvalidRefs.length} memberships with invalid references`);
  } else {
    console.log('✅ All memberships have valid user and team references');
  }
  
  // Check players with non-existent teams
  const playersWithInvalidTeams = await db.collection('players').find({
    teamId: { $nin: teamIds }
  }).toArray();
  
  if (playersWithInvalidTeams.length > 0) {
    console.log(`❌ Found ${playersWithInvalidTeams.length} players with non-existent teams`);
  } else {
    console.log('✅ All players have valid team references');
  }
  
  // Check games with non-existent teams
  const gamesWithInvalidTeams = await db.collection('games').find({
    teamId: { $nin: teamIds }
  }).toArray();
  
  if (gamesWithInvalidTeams.length > 0) {
    console.log(`❌ Found ${gamesWithInvalidTeams.length} games with non-existent teams`);
  } else {
    console.log('✅ All games have valid team references');
  }
  
  // Check lineups with non-existent teams or games
  const lineupsWithInvalidRefs = await db.collection('lineups').find({
    $or: [
      { teamId: { $nin: teamIds } },
      { gameId: { $nin: gameIds } }
    ]
  }).toArray();
  
  if (lineupsWithInvalidRefs.length > 0) {
    console.log(`❌ Found ${lineupsWithInvalidRefs.length} lineups with invalid references`);
  } else {
    console.log('✅ All lineups have valid team and game references');
  }
}

// Run the validation
validateDatabase().catch(console.error);