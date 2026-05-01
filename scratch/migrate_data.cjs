const fs = require('fs');
const path = require('path');

const backupPath = 'c:/Desktop/School management system/Full School Management system/sms_backup_2026-05-01.json';
const mockDataPath = 'c:/Desktop/School management system/Full School Management system/src/data/mockData.js';

try {
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Add missing fields if any
    if (!backupData.messages) backupData.messages = [];
    if (!backupData.notifications) backupData.notifications = [];
    
    const fileContent = `export const initialData = ${JSON.stringify(backupData, null, 2)};\n`;
    
    fs.writeFileSync(mockDataPath, fileContent);
    console.log('Successfully updated mockData.js with migration data.');
} catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
}
