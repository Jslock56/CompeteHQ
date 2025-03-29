/**
 * Script to generate sample template files for schedule imports
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XlsxPopulate from 'xlsx-populate';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directory exists
const templatesDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Games data
const gamesData = [
  ["Date", "Time", "Opponent", "Location", "Notes"],
  ["04/15/2025", "5:30 PM", "Rangers", "Main Field", "Home game"],
  ["04/22/2025", "6:00 PM", "Tigers", "Lincoln Park", "Away game"],
  ["04/29/2025", "5:00 PM", "Eagles", "Central Field", "Bring extra water"],
  ["05/06/2025", "4:30 PM", "Sharks", "Memorial Stadium", "Season finale"]
];

// Practice data
const practicesData = [
  ["Date", "Time", "Location", "Title", "Notes"],
  ["04/10/2025", "4:00 PM", "Training Field", "Batting Practice", "Focus on hitting"],
  ["04/17/2025", "4:00 PM", "Training Field", "Fielding Practice", "Focus on ground balls"],
  ["04/24/2025", "4:00 PM", "Training Field", "Pitching Practice", "Focus on accuracy"],
  ["05/01/2025", "4:00 PM", "Training Field", "Game Prep", "Prepare for season finale"]
];

// Generate CSV games template
fs.writeFileSync(
  path.join(templatesDir, 'games_template.csv'),
  gamesData.map(row => row.join(',')).join('\n')
);

// Generate CSV practices template
fs.writeFileSync(
  path.join(templatesDir, 'practices_template.csv'),
  practicesData.map(row => row.join(',')).join('\n')
);

// Generate TSV games template
fs.writeFileSync(
  path.join(templatesDir, 'games_template.tsv'),
  gamesData.map(row => row.join('\t')).join('\n')
);

// Generate TSV practices template
fs.writeFileSync(
  path.join(templatesDir, 'practices_template.tsv'),
  practicesData.map(row => row.join('\t')).join('\n')
);

// Generate Excel templates
async function createExcelTemplates() {
  // Games Excel template
  const gamesWorkbook = await XlsxPopulate.fromBlankAsync();
  const gamesSheet = gamesWorkbook.sheet(0);
  
  // Add data to sheet
  gamesData.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      gamesSheet.cell(rowIndex + 1, colIndex + 1).value(cell);
    });
  });
  
  // Format header row
  for (let col = 1; col <= gamesData[0].length; col++) {
    gamesSheet.cell(1, col).style("bold", true);
  }
  
  // Save the workbook
  await gamesWorkbook.toFileAsync(path.join(templatesDir, 'games_template.xlsx'));
  
  // Practices Excel template
  const practicesWorkbook = await XlsxPopulate.fromBlankAsync();
  const practicesSheet = practicesWorkbook.sheet(0);
  
  // Add data to sheet
  practicesData.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      practicesSheet.cell(rowIndex + 1, colIndex + 1).value(cell);
    });
  });
  
  // Format header row
  for (let col = 1; col <= practicesData[0].length; col++) {
    practicesSheet.cell(1, col).style("bold", true);
  }
  
  // Save the workbook
  await practicesWorkbook.toFileAsync(path.join(templatesDir, 'practices_template.xlsx'));
  
  console.log('All templates generated successfully!');
}

createExcelTemplates().catch(err => {
  console.error('Error generating Excel templates:', err);
});