const express = require('express');
const router = express.Router();
const multer = require('multer');
const BulkImportController = require('../controllers/BulkImportController');
const { authenticate } = require('../middleware/auth');

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel files
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-office', // Generic Excel
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an Excel file (.xlsx or .xls)'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Get company profiles for selection
router.get('/profiles', BulkImportController.getCompanyProfiles);

// Process bulk import
router.post('/process', upload.single('file'), BulkImportController.processBulkImport);

module.exports = router;

