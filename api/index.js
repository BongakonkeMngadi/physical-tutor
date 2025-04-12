// Serverless function for Vercel deployment
// This file handles API requests for Vercel Functions

// Import required packages
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { generateResponse } = require('../server/src/services/openai');
const { searchPastPapers } = require('../server/src/services/pastPapers');

// Create a simple Express app for the serverless function
const app = express();

// Add basic middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Process question endpoint
app.post('/api/questions', async (req, res) => {
  try {
    console.log('API received request:', req.body);
    
    const { content, topic } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Question content is required'
      });
    }
    
    console.log(`Processing question about: ${topic || 'general topic'}`);
    
    // Search for relevant past papers
    const relevantPastPapers = await searchPastPapers(content, topic);
    
    // Generate response using OpenAI
    const answer = await generateResponse(content, topic, {
      pastPapers: relevantPastPapers
    });
    
    return res.status(200).json({
      success: true,
      data: {
        question: content,
        answer,
        relevantPastPapers
      }
    });
  } catch (error) {
    console.error('Error processing question in serverless function:', error);
    
    let errorMessage = 'Failed to process question';
    
    if (error.message && error.message.includes('OpenAI')) {
      errorMessage = 'AI service error: Unable to generate response';
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add a simple test route
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is working!' });
});

// Export the serverless function handler
module.exports = (req, res) => {
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Pass the request to the Express app
  return app(req, res);
};
