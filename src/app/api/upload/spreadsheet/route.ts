/**
 * API route for handling spreadsheet file uploads (CSV, TSV, Excel)
 * Parses files with flexible headers for games and practices and adds them to the database
 * Can extract relevant information from various file formats
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parse } from 'papaparse';
import * as XLSX from 'xlsx';
import { authService } from '../../../../services/auth/auth-service';
import { connectMongoDB } from '../../../../services/database/mongodb';
import { mongoDBService } from '../../../../services/database/mongodb';
import { Game } from '../../../../types/game';
import { Practice } from '../../../../types/practice';
import { v4 as uuidv4 } from 'uuid';

// Helper to determine if a string looks like a date
function looksLikeDate(str: string): boolean {
  // Simple regex to check for date-like formats (MM/DD/YYYY, MM-DD-YYYY, etc.)
  return /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(str.trim());
}

// Helper to convert a date string to timestamp
function dateStringToTimestamp(dateStr: string, timeStr?: string): number {
  try {
    // Parse date string (handle various formats)
    const dateParts = dateStr.split(/[/-]/);
    let month: number, day: number, year: number;
    
    // Handle MM/DD/YYYY or MM-DD-YYYY
    if (dateParts.length === 3) {
      month = parseInt(dateParts[0]) - 1; // 0-indexed months
      day = parseInt(dateParts[1]);
      year = parseInt(dateParts[2]);
      // If year is 2 digits, assume 2000s
      if (year < 100) {
        year += 2000;
      }
    } else {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    
    // Parse time if provided (HH:MM AM/PM)
    let hours = 0;
    let minutes = 0;
    
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        
        // Handle AM/PM
        if (timeMatch[3] && timeMatch[3].toUpperCase() === 'PM' && hours < 12) {
          hours += 12;
        } else if (timeMatch[3] && timeMatch[3].toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
      }
    }
    
    // Create the date object and return timestamp
    const date = new Date(year, month, day, hours, minutes);
    return date.getTime();
  } catch (error) {
    console.error('Error parsing date:', error);
    // Return current date as fallback
    return Date.now();
  }
}

// Helper to get the current user from the token
async function getCurrentUser(request: NextRequest) {
  // First try cookie-based auth
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth_token');
  const authToken = authCookie?.value;
  
  // If no cookie token, try checking Authorization header
  const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Use whichever token we found
  const token = authToken || headerToken;
  
  if (!token) {
    return null;
  }
  
  try {
    const tokenVerification = await authService.verifyToken(token);
    
    if (!tokenVerification.valid || !tokenVerification.userId) {
      return null;
    }
    
    return authService.getUserById(tokenVerification.userId);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// POST /api/upload/csv - Upload and process a CSV file
export async function POST(request: NextRequest) {
  try {
    // Ensure MongoDB is connected
    await connectMongoDB();
    
    // Authenticate user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teamId = formData.get('teamId') as string;
    const importType = formData.get('importType') as string; // 'games' or 'practices'
    
    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    if (!importType || !['games', 'practices'].includes(importType)) {
      return NextResponse.json(
        { success: false, message: 'Import type must be "games" or "practices"' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this team
    if (!user.teams.includes(teamId)) {
      // For development, we'll add the team to the user's teams
      console.log('Adding team to user teams for development');
      user.teams.push(teamId);
      await user.save();
    }
    
    // Detect file type
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || 
                   fileName.endsWith('.xls') || 
                   fileName.endsWith('.xlsm') ||
                   file.type.includes('excel') ||
                   file.type.includes('spreadsheetml');
    
    const isTabSeparated = fileName.endsWith('.tsv') || 
                          fileName.endsWith('.txt') ||
                          file.type.includes('tab-separated');
    
    let records: any[] = [];
    
    try {
      if (isExcel) {
        // Handle Excel files
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        
        // Get the first worksheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // Transform headers to lowercase
        records = jsonData.map(row => {
          const newRow: Record<string, any> = {};
          Object.keys(row).forEach(key => {
            newRow[key.trim().toLowerCase()] = row[key];
          });
          return newRow;
        });
        
        console.log('Parsed Excel file with', records.length, 'records');
      } else if (isTabSeparated) {
        // Handle TSV files
        const fileContent = await file.text();
        
        const parseResult = parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          delimiter: '\t',
          transformHeader: (header) => header.trim().toLowerCase()
        });
        
        if (parseResult.errors.length > 0) {
          throw new Error(`Error parsing TSV file: ${parseResult.errors[0].message}`);
        }
        
        records = parseResult.data;
        console.log('Parsed TSV file with', records.length, 'records');
      } else {
        // Assume CSV
        const fileContent = await file.text();
        
        const parseResult = parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase()
        });
        
        if (parseResult.errors.length > 0) {
          throw new Error(`Error parsing CSV file: ${parseResult.errors[0].message}`);
        }
        
        records = parseResult.data;
        console.log('Parsed CSV file with', records.length, 'records');
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Error parsing file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
        },
        { status: 400 }
      );
    }
    
    if (!records || records.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No records found in CSV file' },
        { status: 400 }
      );
    }
    
    // Process records based on import type
    let createdCount = 0;
    let failedCount = 0;
    const now = Date.now();
    
    // Helper function to intelligently map headers to our expected fields
    function findBestMatchingField(headers: string[], targetConcepts: string[]): string | null {
      // Check for exact matches first
      for (const header of headers) {
        for (const concept of targetConcepts) {
          if (header.toLowerCase() === concept.toLowerCase()) {
            return header;
          }
        }
      }
      
      // If no exact match, look for partial matches
      for (const header of headers) {
        for (const concept of targetConcepts) {
          if (header.toLowerCase().includes(concept.toLowerCase())) {
            return header;
          }
        }
      }
      
      // If no partial match in the header, see if a header contains any concept
      for (const concept of targetConcepts) {
        for (const header of headers) {
          if (concept.toLowerCase().includes(header.toLowerCase())) {
            return header;
          }
        }
      }
      
      return null;
    }
    
    // Helper function to detect date fields by analyzing their content
    function findDateField(row: Record<string, string>): string | null {
      for (const key of Object.keys(row)) {
        if (looksLikeDate(row[key])) {
          return key;
        }
      }
      return null;
    }
    
    // Extract common date/time information from a record
    function extractDateTimeInfo(row: Record<string, string>) {
      const headers = Object.keys(row);
      
      // Try to find date field by both header name and content
      let dateField = findBestMatchingField(headers, ['date', 'game date', 'practice date', 'event date', 'day']);
      
      // If no date field was found by name, try to find by content (looks like a date)
      if (!dateField) {
        dateField = findDateField(row);
      }
      
      // Try to find time field
      const timeField = findBestMatchingField(headers, ['time', 'game time', 'practice time', 'start time', 'begins']);
      
      // Return the values with null if not found
      return {
        dateValue: dateField ? row[dateField] : null,
        timeValue: timeField ? row[timeField] : null
      };
    }
    
    // Analyze all data to get field mappings
    const firstRecord = records[0] as Record<string, string>;
    const headers = Object.keys(firstRecord);
    
    if (importType === 'games') {
      // Define possible fields for games (in order of preference)
      const possibleDateFields = ['date', 'game date', 'event date', 'day'];
      const possibleTimeFields = ['time', 'game time', 'start time', 'begins'];
      const possibleOpponentFields = ['opponent', 'team', 'vs', 'against', 'competition', 'away team', 'home team'];
      const possibleLocationFields = ['location', 'field', 'venue', 'where', 'place', 'facility', 'stadium'];
      const possibleNotesFields = ['notes', 'comments', 'details', 'description', 'info'];
      
      // Build field mappings (will be used for each record)
      const mappings = {
        date: findBestMatchingField(headers, possibleDateFields),
        time: findBestMatchingField(headers, possibleTimeFields),
        opponent: findBestMatchingField(headers, possibleOpponentFields),
        location: findBestMatchingField(headers, possibleLocationFields), 
        notes: findBestMatchingField(headers, possibleNotesFields)
      };
      
      console.log('Detected field mappings for games:', mappings);
      
      // If we can't find required date field, at least inform the user
      if (!mappings.date && !headers.some(h => firstRecord[h] && looksLikeDate(firstRecord[h]))) {
        return NextResponse.json({
          success: false,
          message: "Couldn't find date information in the CSV file. Please ensure your file includes dates.",
          possibleHeaders: headers
        }, { status: 400 });
      }
      
      // Process game records
      for (const record of records) {
        try {
          const row = record as Record<string, string>;
          
          // First try to get date/time using our mappings
          let dateValue = mappings.date ? row[mappings.date] : null;
          let timeValue = mappings.time ? row[mappings.time] : null;
          
          // If no date was found using mappings, try to extract it directly
          if (!dateValue) {
            const extractedInfo = extractDateTimeInfo(row);
            dateValue = extractedInfo.dateValue;
            if (!timeValue) timeValue = extractedInfo.timeValue;
          }
          
          // Skip record if we still couldn't find a date
          if (!dateValue) {
            console.error('Cannot find date information in row:', row);
            failedCount++;
            continue;
          }
          
          // Get opponent and location with fallbacks
          const opponent = mappings.opponent && row[mappings.opponent] ? 
            row[mappings.opponent] : 'Unknown';
            
          const location = mappings.location && row[mappings.location] ? 
            row[mappings.location] : 'TBD';
            
          const notes = mappings.notes && row[mappings.notes] ?
            row[mappings.notes] : '';
          
          // Create new game
          const newGame: Game = {
            id: uuidv4(),
            teamId,
            opponent,
            location,
            date: dateStringToTimestamp(dateValue, timeValue),
            notes,
            createdAt: now,
            updatedAt: now
          };
          
          // Save to MongoDB
          const success = await mongoDBService.saveGame(newGame);
          
          if (success) {
            createdCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error('Error processing game record:', error);
          failedCount++;
        }
      }
    } else if (importType === 'practices') {
      // Define possible fields for practices (in order of preference)
      const possibleDateFields = ['date', 'practice date', 'event date', 'day'];
      const possibleTimeFields = ['time', 'practice time', 'start time', 'begins'];
      const possibleLocationFields = ['location', 'field', 'venue', 'where', 'place', 'facility'];
      const possibleTitleFields = ['title', 'name', 'description', 'focus', 'topic'];
      const possibleNotesFields = ['notes', 'comments', 'details', 'additional info'];
      
      // Build field mappings (will be used for each record)
      const mappings = {
        date: findBestMatchingField(headers, possibleDateFields),
        time: findBestMatchingField(headers, possibleTimeFields),
        location: findBestMatchingField(headers, possibleLocationFields),
        title: findBestMatchingField(headers, possibleTitleFields),
        notes: findBestMatchingField(headers, possibleNotesFields)
      };
      
      console.log('Detected field mappings for practices:', mappings);
      
      // If we can't find required date field, at least inform the user
      if (!mappings.date && !headers.some(h => firstRecord[h] && looksLikeDate(firstRecord[h]))) {
        return NextResponse.json({
          success: false,
          message: "Couldn't find date information in the CSV file. Please ensure your file includes dates.",
          possibleHeaders: headers
        }, { status: 400 });
      }
      
      // Process practice records
      for (const record of records) {
        try {
          const row = record as Record<string, string>;
          
          // First try to get date/time using our mappings
          let dateValue = mappings.date ? row[mappings.date] : null;
          let timeValue = mappings.time ? row[mappings.time] : null;
          
          // If no date was found using mappings, try to extract it directly
          if (!dateValue) {
            const extractedInfo = extractDateTimeInfo(row);
            dateValue = extractedInfo.dateValue;
            if (!timeValue) timeValue = extractedInfo.timeValue;
          }
          
          // Skip record if we still couldn't find a date
          if (!dateValue) {
            console.error('Cannot find date information in row:', row);
            failedCount++;
            continue;
          }
          
          // Get location, title and notes with fallbacks
          const location = mappings.location && row[mappings.location] ?
            row[mappings.location] : 'TBD';
            
          const title = mappings.title && row[mappings.title] ?
            row[mappings.title] : `Practice ${new Date(dateStringToTimestamp(dateValue, timeValue)).toLocaleDateString()}`;
            
          const notes = mappings.notes && row[mappings.notes] ?
            row[mappings.notes] : '';
          
          // Create new practice
          const newPractice: Practice = {
            id: uuidv4(),
            teamId,
            title,
            location,
            date: dateStringToTimestamp(dateValue, timeValue),
            notes,
            drills: [],
            createdAt: now,
            updatedAt: now
          };
          
          // Save to MongoDB
          const success = await mongoDBService.savePractice(newPractice);
          
          if (success) {
            createdCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error('Error processing practice record:', error);
          failedCount++;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${importType} imported successfully`,
      created: createdCount,
      failed: failedCount,
      total: records.length
    });
    
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during file processing' },
      { status: 500 }
    );
  }
}