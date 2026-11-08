const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createCase,
  getCases,
  bulkImportCases,
  createCaseWithAIAnalysis,
  getUserCases,
} = require('../controllers/adminCaseController');

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      callback(new Error('Only .csv files are allowed.'));
      return;
    }
    callback(null, true);
  },
});

const handleCsvUpload = (req, res, next) => {
  uploadCsv.single('file')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
            ? 'CSV file must be 50 MB or smaller.'
            : error.message,
      });
    }
    next();
  });
};

const analysisUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
    callback(allowed.includes(file.mimetype) ? null : new Error('Only PDF, image, or text files are allowed.'), allowed.includes(file.mimetype));
  },
});

router.get('/my-cases', protect, getUserCases);
router.post('/create-ai', protect, analysisUpload.single('file'), createCaseWithAIAnalysis);
router.post('/bulk-import', protect, handleCsvUpload, bulkImportCases);

router.route('/')
  .post(createCase)
  .get(getCases);

module.exports = router;
