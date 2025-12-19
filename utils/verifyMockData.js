require('dotenv').config();
const database = require('../config/database');
const { logger } = require('./logger');

async function verifyMockData() {
  try {
    await database.connect();
    
    const accounts = await database.query('SELECT COUNT(*) as count FROM accounts');
    const contacts = await database.query('SELECT COUNT(*) as count FROM contacts');
    const opportunities = await database.query('SELECT COUNT(*) as count FROM opportunities');
    const proposals = await database.query('SELECT COUNT(*) as count FROM proposals');
    const notes = await database.query('SELECT COUNT(*) as count FROM notes');
    const reminders = await database.query('SELECT COUNT(*) as count FROM reminders');
    
    console.log('\n=== Mock Data Summary ===');
    console.log(`Accounts: ${accounts[0].count}`);
    console.log(`Contacts: ${contacts[0].count}`);
    console.log(`Opportunities: ${opportunities[0].count}`);
    console.log(`Proposals: ${proposals[0].count}`);
    console.log(`Notes: ${notes[0].count}`);
    console.log(`Reminders: ${reminders[0].count}`);
    console.log('========================\n');
    
    await database.close();
    process.exit(0);
  } catch (error) {
    logger.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyMockData();







