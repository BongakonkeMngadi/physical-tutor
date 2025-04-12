const express = require('express');
const router = express.Router();
const { processQuestion, getQuestions } = require('../controllers/questionController');

// Question routes
router.post('/', processQuestion);
router.get('/', getQuestions);

// Get a specific question by ID
router.get('/:id', (req, res) => {
  res.status(200).json({ success: true, message: `Get question with ID: ${req.params.id} endpoint` });
});

module.exports = router;
