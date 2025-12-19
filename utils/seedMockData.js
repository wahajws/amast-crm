require('dotenv').config();
const database = require('../config/database');
const { logger } = require('./logger');

async function seedMockData() {
  try {
    await database.connect();
    logger.info('Starting mock data seeding...');

    // Get admin user ID
    const adminUsers = await database.query("SELECT id FROM users WHERE email = 'admin@crm.com' LIMIT 1");
    const adminUserId = adminUsers.length > 0 ? adminUsers[0].id : 1;

    // Insert Accounts
    const accounts = [
      { name: 'Acme Corporation', industry: 'Technology', website: 'https://www.acme-corp.com', phone: '+1-555-0101', email: 'info@acme-corp.com', billing_street: '123 Tech Boulevard', billing_city: 'San Francisco', billing_state: 'CA', billing_postal_code: '94105', billing_country: 'USA', description: 'Leading technology solutions provider', annual_revenue: 50000000.00, number_of_employees: 250, owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { name: 'Global Industries Ltd', industry: 'Manufacturing', website: 'https://www.global-industries.com', phone: '+1-555-0202', email: 'contact@global-industries.com', billing_street: '456 Industrial Park', billing_city: 'Chicago', billing_state: 'IL', billing_postal_code: '60601', billing_country: 'USA', description: 'International manufacturing company', annual_revenue: 120000000.00, number_of_employees: 500, owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { name: 'TechStart Solutions', industry: 'Software', website: 'https://www.techstart.com', phone: '+1-555-0303', email: 'hello@techstart.com', billing_street: '789 Innovation Drive', billing_city: 'Austin', billing_state: 'TX', billing_postal_code: '78701', billing_country: 'USA', description: 'Startup software development company', annual_revenue: 5000000.00, number_of_employees: 50, owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { name: 'MediCare Systems', industry: 'Healthcare', website: 'https://www.medicare-systems.com', phone: '+1-555-0404', email: 'info@medicare-systems.com', billing_street: '321 Health Avenue', billing_city: 'Boston', billing_state: 'MA', billing_postal_code: '02101', billing_country: 'USA', description: 'Healthcare management systems', annual_revenue: 75000000.00, number_of_employees: 300, owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { name: 'FinanceFirst Group', industry: 'Financial Services', website: 'https://www.financefirst.com', phone: '+1-555-0505', email: 'contact@financefirst.com', billing_street: '654 Wall Street', billing_city: 'New York', billing_state: 'NY', billing_postal_code: '10005', billing_country: 'USA', description: 'Financial advisory services', annual_revenue: 200000000.00, number_of_employees: 800, owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId }
    ];

    const accountIds = {};
    for (const account of accounts) {
      const result = await database.query(
        `INSERT INTO accounts (name, industry, website, phone, email, billing_street, billing_city, billing_state, billing_postal_code, billing_country, description, annual_revenue, number_of_employees, owner_id, status, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [account.name, account.industry, account.website, account.phone, account.email, account.billing_street, account.billing_city, account.billing_state, account.billing_postal_code, account.billing_country, account.description, account.annual_revenue, account.number_of_employees, account.owner_id, account.status, account.created_by, account.updated_by]
      );
      accountIds[account.name] = result.insertId;
    }
    logger.info(`✓ Inserted ${accounts.length} accounts`);

    // Insert Contacts
    const contacts = [
      { first_name: 'John', last_name: 'Smith', email: 'john.smith@acme-corp.com', phone: '+1-555-1001', mobile: '+1-555-1002', title: 'CEO', department: 'Executive', account_id: accountIds['Acme Corporation'], mailing_street: '123 Tech Boulevard', mailing_city: 'San Francisco', mailing_state: 'CA', mailing_postal_code: '94105', mailing_country: 'USA', description: 'Chief Executive Officer', owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@acme-corp.com', phone: '+1-555-1003', mobile: '+1-555-1004', title: 'VP of Sales', department: 'Sales', account_id: accountIds['Acme Corporation'], mailing_street: '123 Tech Boulevard', mailing_city: 'San Francisco', mailing_state: 'CA', mailing_postal_code: '94105', mailing_country: 'USA', description: 'Vice President of Sales', owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { first_name: 'Michael', last_name: 'Brown', email: 'michael.brown@global-industries.com', phone: '+1-555-2001', mobile: '+1-555-2002', title: 'Operations Manager', department: 'Operations', account_id: accountIds['Global Industries Ltd'], mailing_street: '456 Industrial Park', mailing_city: 'Chicago', mailing_state: 'IL', mailing_postal_code: '60601', mailing_country: 'USA', description: 'Operations Manager', owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { first_name: 'Emily', last_name: 'Davis', email: 'emily.davis@techstart.com', phone: '+1-555-3001', mobile: '+1-555-3002', title: 'CTO', department: 'Technology', account_id: accountIds['TechStart Solutions'], mailing_street: '789 Innovation Drive', mailing_city: 'Austin', mailing_state: 'TX', mailing_postal_code: '78701', mailing_country: 'USA', description: 'Chief Technology Officer', owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { first_name: 'David', last_name: 'Wilson', email: 'david.wilson@medicare-systems.com', phone: '+1-555-4001', mobile: '+1-555-4002', title: 'Director of IT', department: 'IT', account_id: accountIds['MediCare Systems'], mailing_street: '321 Health Avenue', mailing_city: 'Boston', mailing_state: 'MA', mailing_postal_code: '02101', mailing_country: 'USA', description: 'IT Director', owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { first_name: 'Lisa', last_name: 'Anderson', email: 'lisa.anderson@financefirst.com', phone: '+1-555-5001', mobile: '+1-555-5002', title: 'CFO', department: 'Finance', account_id: accountIds['FinanceFirst Group'], mailing_street: '654 Wall Street', mailing_city: 'New York', mailing_state: 'NY', mailing_postal_code: '10005', mailing_country: 'USA', description: 'Chief Financial Officer', owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { first_name: 'Robert', last_name: 'Taylor', email: 'robert.taylor@acme-corp.com', phone: '+1-555-1005', mobile: '+1-555-1006', title: 'Marketing Director', department: 'Marketing', account_id: accountIds['Acme Corporation'], mailing_street: '123 Tech Boulevard', mailing_city: 'San Francisco', mailing_state: 'CA', mailing_postal_code: '94105', mailing_country: 'USA', description: 'Marketing Director', owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { first_name: 'Jennifer', last_name: 'Martinez', email: 'jennifer.martinez@global-industries.com', phone: '+1-555-2003', mobile: '+1-555-2004', title: 'HR Manager', department: 'Human Resources', account_id: accountIds['Global Industries Ltd'], mailing_street: '456 Industrial Park', mailing_city: 'Chicago', mailing_state: 'IL', mailing_postal_code: '60601', mailing_country: 'USA', description: 'Human Resources Manager', owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId }
    ];

    const contactIds = {};
    for (const contact of contacts) {
      const result = await database.query(
        `INSERT INTO contacts (first_name, last_name, email, phone, mobile, title, department, account_id, mailing_street, mailing_city, mailing_state, mailing_postal_code, mailing_country, description, owner_id, status, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [contact.first_name, contact.last_name, contact.email, contact.phone, contact.mobile, contact.title, contact.department, contact.account_id, contact.mailing_street, contact.mailing_city, contact.mailing_state, contact.mailing_postal_code, contact.mailing_country, contact.description, contact.owner_id, contact.status, contact.created_by, contact.updated_by]
      );
      contactIds[contact.email] = result.insertId;
    }
    logger.info(`✓ Inserted ${contacts.length} contacts`);

    // Insert Opportunities
    const opportunities = [
      { name: 'Enterprise Software License', description: 'Large enterprise software license deal with Acme Corporation', account_id: accountIds['Acme Corporation'], contact_id: contactIds['john.smith@acme-corp.com'], stage: 'NEGOTIATION', probability: 75, amount: 500000.00, expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { name: 'Cloud Migration Project', description: 'Cloud infrastructure migration project for Global Industries', account_id: accountIds['Global Industries Ltd'], contact_id: contactIds['michael.brown@global-industries.com'], stage: 'PROPOSAL', probability: 60, amount: 250000.00, expected_close_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { name: 'Startup Partnership', description: 'Technology partnership opportunity with TechStart Solutions', account_id: accountIds['TechStart Solutions'], contact_id: contactIds['emily.davis@techstart.com'], stage: 'QUALIFICATION', probability: 40, amount: 100000.00, expected_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { name: 'Healthcare System Upgrade', description: 'Major system upgrade for MediCare Systems', account_id: accountIds['MediCare Systems'], contact_id: contactIds['david.wilson@medicare-systems.com'], stage: 'PROSPECTING', probability: 25, amount: 750000.00, expected_close_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), owner_id: adminUserId, status: 'ACTIVE', created_by: adminUserId, updated_by: adminUserId },
      { name: 'Financial Services Contract', description: 'Long-term contract with FinanceFirst Group', account_id: accountIds['FinanceFirst Group'], contact_id: contactIds['lisa.anderson@financefirst.com'], stage: 'CLOSED_WON', probability: 100, amount: 1200000.00, expected_close_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), actual_close_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), owner_id: adminUserId, status: 'WON', created_by: adminUserId, updated_by: adminUserId }
    ];

    const opportunityIds = {};
    for (const opp of opportunities) {
      const result = await database.query(
        `INSERT INTO opportunities (name, description, account_id, contact_id, stage, probability, amount, expected_close_date, actual_close_date, owner_id, status, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [opp.name, opp.description, opp.account_id, opp.contact_id, opp.stage, opp.probability, opp.amount, opp.expected_close_date, opp.actual_close_date || null, opp.owner_id, opp.status, opp.created_by, opp.updated_by]
      );
      opportunityIds[opp.name] = result.insertId;
    }
    logger.info(`✓ Inserted ${opportunities.length} opportunities`);

    // Insert Proposals
    const proposals = [
      { title: 'Enterprise Software License Proposal', description: 'Comprehensive proposal for enterprise software license', opportunity_id: opportunityIds['Enterprise Software License'], account_id: accountIds['Acme Corporation'], contact_id: contactIds['john.smith@acme-corp.com'], proposal_number: 'PROP-2024-001', amount: 500000.00, currency: 'USD', valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: 'SENT', owner_id: adminUserId, created_by: adminUserId, updated_by: adminUserId },
      { title: 'Cloud Migration Services Proposal', description: 'Detailed proposal for cloud migration services', opportunity_id: opportunityIds['Cloud Migration Project'], account_id: accountIds['Global Industries Ltd'], contact_id: contactIds['michael.brown@global-industries.com'], proposal_number: 'PROP-2024-002', amount: 250000.00, currency: 'USD', valid_until: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), status: 'REVIEWED', owner_id: adminUserId, created_by: adminUserId, updated_by: adminUserId },
      { title: 'Technology Partnership Proposal', description: 'Partnership proposal for TechStart Solutions', opportunity_id: opportunityIds['Startup Partnership'], account_id: accountIds['TechStart Solutions'], contact_id: contactIds['emily.davis@techstart.com'], proposal_number: 'PROP-2024-003', amount: 100000.00, currency: 'USD', valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), status: 'DRAFT', owner_id: adminUserId, created_by: adminUserId, updated_by: adminUserId },
      { title: 'Healthcare System Upgrade Proposal', description: 'Proposal for healthcare system upgrade', opportunity_id: null, account_id: accountIds['MediCare Systems'], contact_id: contactIds['david.wilson@medicare-systems.com'], proposal_number: 'PROP-2024-004', amount: 750000.00, currency: 'USD', valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), status: 'APPROVED', owner_id: adminUserId, created_by: adminUserId, updated_by: adminUserId },
      { title: 'Financial Services Contract Proposal', description: 'Long-term contract proposal', opportunity_id: null, account_id: accountIds['FinanceFirst Group'], contact_id: contactIds['lisa.anderson@financefirst.com'], proposal_number: 'PROP-2024-005', amount: 1200000.00, currency: 'USD', valid_until: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'ACCEPTED', owner_id: adminUserId, created_by: adminUserId, updated_by: adminUserId }
    ];

    for (const proposal of proposals) {
      await database.query(
        `INSERT INTO proposals (title, description, opportunity_id, account_id, contact_id, proposal_number, amount, currency, valid_until, status, owner_id, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [proposal.title, proposal.description, proposal.opportunity_id, proposal.account_id, proposal.contact_id, proposal.proposal_number, proposal.amount, proposal.currency, proposal.valid_until, proposal.status, proposal.owner_id, proposal.created_by, proposal.updated_by]
      );
    }
    logger.info(`✓ Inserted ${proposals.length} proposals`);

    // Insert Notes
    const notes = [
      { title: 'Initial Meeting with John Smith', content: 'Had a productive initial meeting with John Smith, CEO of Acme Corporation. Discussed their software needs and potential partnership opportunities.', contact_id: contactIds['john.smith@acme-corp.com'], account_id: null, created_by: adminUserId, updated_by: adminUserId },
      { title: 'Follow-up Call with Sarah Johnson', content: 'Follow-up call regarding the sales proposal. Sarah showed strong interest and requested additional information.', contact_id: contactIds['sarah.johnson@acme-corp.com'], account_id: null, created_by: adminUserId, updated_by: adminUserId },
      { title: 'Acme Corporation - Company Overview', content: 'Acme Corporation is a leading technology company with 250 employees. They are looking to expand their software infrastructure.', contact_id: null, account_id: accountIds['Acme Corporation'], created_by: adminUserId, updated_by: adminUserId },
      { title: 'Global Industries - Project Discussion', content: 'Discussed the cloud migration project with Michael Brown. They need a comprehensive solution for their manufacturing operations.', contact_id: null, account_id: accountIds['Global Industries Ltd'], created_by: adminUserId, updated_by: adminUserId },
      { title: 'TechStart Solutions - Partnership Opportunity', content: 'Emily Davis, CTO, expressed interest in a technology partnership. They are a growing startup with innovative solutions.', contact_id: null, account_id: accountIds['TechStart Solutions'], created_by: adminUserId, updated_by: adminUserId },
      { title: 'MediCare Systems - System Requirements', content: 'David Wilson provided detailed requirements for the healthcare system upgrade. They need HIPAA-compliant solutions.', contact_id: null, account_id: accountIds['MediCare Systems'], created_by: adminUserId, updated_by: adminUserId }
    ];

    for (const note of notes) {
      await database.query(
        `INSERT INTO notes (title, content, contact_id, account_id, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [note.title, note.content, note.contact_id, note.account_id, note.created_by, note.updated_by]
      );
    }
    logger.info(`✓ Inserted ${notes.length} notes`);

    // Insert Reminders
    const reminders = [
      { title: 'Follow up with John Smith', description: 'Schedule follow-up meeting with John Smith to discuss the enterprise software proposal', contact_id: contactIds['john.smith@acme-corp.com'], account_id: null, due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), priority: 'HIGH', status: 'PENDING', created_by: adminUserId, updated_by: adminUserId },
      { title: 'Send proposal to Sarah Johnson', description: 'Send the detailed sales proposal to Sarah Johnson at Acme Corporation', contact_id: contactIds['sarah.johnson@acme-corp.com'], account_id: null, due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), priority: 'HIGH', status: 'PENDING', created_by: adminUserId, updated_by: adminUserId },
      { title: 'Review contract with Acme Corporation', description: 'Review and finalize the contract terms with Acme Corporation', contact_id: null, account_id: accountIds['Acme Corporation'], due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), priority: 'MEDIUM', status: 'PENDING', created_by: adminUserId, updated_by: adminUserId },
      { title: 'Prepare presentation for Global Industries', description: 'Prepare presentation for the cloud migration project proposal', contact_id: null, account_id: accountIds['Global Industries Ltd'], due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), priority: 'MEDIUM', status: 'PENDING', created_by: adminUserId, updated_by: adminUserId },
      { title: 'Schedule demo with TechStart Solutions', description: 'Schedule product demonstration for TechStart Solutions partnership opportunity', contact_id: null, account_id: accountIds['TechStart Solutions'], due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), priority: 'LOW', status: 'PENDING', created_by: adminUserId, updated_by: adminUserId },
      { title: 'Quarterly review with MediCare Systems', description: 'Quarterly business review meeting with MediCare Systems', contact_id: null, account_id: accountIds['MediCare Systems'], due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), priority: 'MEDIUM', status: 'PENDING', created_by: adminUserId, updated_by: adminUserId },
      { title: 'Contract renewal discussion with FinanceFirst', description: 'Discuss contract renewal terms with FinanceFirst Group', contact_id: null, account_id: accountIds['FinanceFirst Group'], due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), priority: 'LOW', status: 'PENDING', created_by: adminUserId, updated_by: adminUserId }
    ];

    for (const reminder of reminders) {
      await database.query(
        `INSERT INTO reminders (title, description, contact_id, account_id, due_date, priority, status, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reminder.title, reminder.description, reminder.contact_id, reminder.account_id, reminder.due_date, reminder.priority, reminder.status, reminder.created_by, reminder.updated_by]
      );
    }
    logger.info(`✓ Inserted ${reminders.length} reminders`);

    // Summary
    const accountCount = await database.query('SELECT COUNT(*) as count FROM accounts');
    const contactCount = await database.query('SELECT COUNT(*) as count FROM contacts');
    const oppCount = await database.query('SELECT COUNT(*) as count FROM opportunities');
    const propCount = await database.query('SELECT COUNT(*) as count FROM proposals');
    const noteCount = await database.query('SELECT COUNT(*) as count FROM notes');
    const reminderCount = await database.query('SELECT COUNT(*) as count FROM reminders');

    logger.info('\n=== Mock Data Summary ===');
    logger.info(`Accounts: ${accountCount[0].count}`);
    logger.info(`Contacts: ${contactCount[0].count}`);
    logger.info(`Opportunities: ${oppCount[0].count}`);
    logger.info(`Proposals: ${propCount[0].count}`);
    logger.info(`Notes: ${noteCount[0].count}`);
    logger.info(`Reminders: ${reminderCount[0].count}`);
    logger.info('========================\n');

    await database.close();
    logger.info('Mock data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Mock data seeding failed:', error);
    await database.close();
    process.exit(1);
  }
}

seedMockData();

