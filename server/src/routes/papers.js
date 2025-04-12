const express = require('express');
const router = express.Router();

// Basic placeholder routes
router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Get all past papers endpoint' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ success: true, message: `Get past paper with ID: ${req.params.id} endpoint` });
});

router.get('/:id/questions', (req, res) => {
  res.status(200).json({ success: true, message: `Get questions for paper with ID: ${req.params.id} endpoint` });
});

module.exports = router;
