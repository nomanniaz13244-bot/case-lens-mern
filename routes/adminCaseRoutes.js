const express = require('express');
const router = express.Router();
const {
  createCase,
  getCases,
} = require('../controllers/adminCaseController');

router.route('/')
  .post(createCase)
  .get(getCases);

module.exports = router;
