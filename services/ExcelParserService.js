const XLSX = require('xlsx');
const { logger } = require('../utils/logger');

class ExcelParserService {
  /**
   * Parse Excel file and extract customer data
   * @param {Buffer} fileBuffer - Excel file buffer
   * @returns {Array} Array of customer objects extracted from Excel
   */
  parseExcel(fileBuffer) {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const customers = [];

      // Process all sheets
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        sheetData.forEach((row, index) => {
          try {
            const customer = this.extractCustomerData(row, index + 2); // +2 because Excel rows start at 1 and we skip header
            if (customer && customer.email) {
              customers.push(customer);
            }
          } catch (error) {
            logger.warn(`Error parsing row ${index + 2} in sheet "${sheetName}":`, error.message);
          }
        });
      });

      logger.info(`Parsed ${customers.length} customers from Excel file`);
      return customers;
    } catch (error) {
      logger.error('Error parsing Excel file:', error);
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Extract customer data from a row
   * Tries to intelligently map Excel columns to customer fields
   */
  extractCustomerData(row, rowNumber) {
    const customer = {
      rowNumber,
      email: null,
      firstName: null,
      lastName: null,
      phone: null,
      companyName: null,
      website: null,
      industry: null,
      title: null,
      department: null,
      location: null,
      rawData: row, // Keep raw data for reference
    };

    // Normalize keys (remove spaces, convert to lowercase)
    const normalizedRow = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      normalizedRow[normalizedKey] = row[key];
    });

    // Try to find email (most important field)
    customer.email = this.findField(normalizedRow, [
      'email', 'e-mail', 'email_address', 'emailaddress',
      'contact_email', 'contactemail', 'email_id'
    ]);

    if (!customer.email) {
      // If no email found, skip this row
      return null;
    }

    // Extract domain from email for company lookup
    try {
      const emailDomain = customer.email.split('@')[1];
      if (emailDomain) {
        customer.emailDomain = emailDomain.toLowerCase();
        // Try to extract company name from domain
        customer.companyName = customer.companyName || emailDomain.split('.')[0];
      }
    } catch (error) {
      // Ignore domain extraction errors
    }

    // Try to find name fields
    customer.firstName = this.findField(normalizedRow, [
      'first_name', 'firstname', 'fname', 'given_name'
    ]);
    customer.lastName = this.findField(normalizedRow, [
      'last_name', 'lastname', 'lname', 'surname', 'family_name'
    ]);

    // If we have a single "name" field, try to split it
    if (!customer.firstName && !customer.lastName) {
      const fullName = this.findField(normalizedRow, ['name', 'full_name', 'fullname', 'contact_name', 'customer_name', 'client_name']);
      if (fullName) {
        const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
        if (nameParts.length > 0) {
          customer.firstName = nameParts[0] || 'Contact';
          // If only one part, use it as first name and set last name to 'N/A'
          // If multiple parts, use first as first name, rest as last name
          if (nameParts.length === 1) {
            customer.lastName = 'N/A';
          } else {
            customer.lastName = nameParts.slice(1).join(' ') || 'N/A';
          }
        }
      }
    }
    
    // Ensure we always have both first and last name (database requirement: NOT NULL)
    if (!customer.firstName || customer.firstName.trim() === '') {
      customer.firstName = 'Contact';
    }
    if (!customer.lastName || customer.lastName.trim() === '') {
      // Try to extract from email if possible
      const emailPrefix = customer.email.split('@')[0];
      if (emailPrefix && emailPrefix.includes('.')) {
        const emailParts = emailPrefix.split('.');
        if (emailParts.length > 1) {
          customer.firstName = emailParts[0] || 'Contact';
          customer.lastName = emailParts.slice(1).join(' ') || 'N/A';
        } else {
          customer.lastName = 'N/A';
        }
      } else {
        customer.lastName = 'N/A';
      }
    }
    
    // Final safety check - ensure last_name is never empty or null
    if (!customer.lastName || customer.lastName.trim() === '') {
      customer.lastName = 'N/A';
    }

    // Try to find company name
    customer.companyName = this.findField(normalizedRow, [
      'company', 'company_name', 'companyname', 'organization', 'org',
      'business_name', 'businessname', 'firm', 'client_company'
    ]) || customer.companyName;

    // Try to find phone
    customer.phone = this.findField(normalizedRow, [
      'phone', 'phone_number', 'phonenumber', 'telephone', 'tel',
      'mobile', 'mobile_number', 'cell', 'contact_number'
    ]);

    // Try to find website
    customer.website = this.findField(normalizedRow, [
      'website', 'web', 'url', 'site', 'company_website', 'web_address'
    ]);

    // Try to find industry
    customer.industry = this.findField(normalizedRow, [
      'industry', 'sector', 'business_type', 'category'
    ]);

    // Try to find title
    customer.title = this.findField(normalizedRow, [
      'title', 'job_title', 'jobtitle', 'position', 'role', 'designation'
    ]);

    // Try to find department
    customer.department = this.findField(normalizedRow, [
      'department', 'dept', 'division', 'unit'
    ]);

    // Try to find location
    const location = {
      city: this.findField(normalizedRow, ['city', 'location', 'locality']),
      state: this.findField(normalizedRow, ['state', 'province', 'region']),
      country: this.findField(normalizedRow, ['country', 'nation'])
    };
    if (location.city || location.state || location.country) {
      customer.location = location;
    }

    return customer;
  }

  /**
   * Find a field value by trying multiple possible column names
   */
  findField(normalizedRow, possibleKeys) {
    for (const key of possibleKeys) {
      if (normalizedRow[key] && normalizedRow[key].toString().trim() !== '') {
        return normalizedRow[key].toString().trim();
      }
    }
    return null;
  }
}

module.exports = new ExcelParserService();

