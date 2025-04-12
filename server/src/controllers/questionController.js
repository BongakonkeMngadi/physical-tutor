const { generateResponse } = require('../services/openai');
const { searchPastPapers } = require('../services/pastPapers');
const Question = require('../models/Question');

/**
 * Process a new question from a student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processQuestion = async (req, res) => {
  try {
    // Log request details for debugging
    console.log('Question request received:', {
      contentLength: req.body?.content?.length || 0,
      topic: req.body?.topic || 'not specified',
      path: req.path,
      method: req.method,
      headers: req.headers['content-type']
    });
    
    const { content, topic } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Question content is required'
      });
    }
    
    console.log('Searching for past papers for:', content.substring(0, 50) + '...');
    // Search for relevant past paper questions
    const relevantPastPapers = await searchPastPapers(content, topic);
    console.log(`Found ${relevantPastPapers.length} relevant past papers`);
    
    // Generate response using OpenAI and past paper context
    console.log('Generating response from OpenAI...');
    const answer = await generateResponse(content, topic, {
      pastPapers: relevantPastPapers
    });
    console.log('Successfully generated response from OpenAI');
    
    // In a production environment with MongoDB, we would save the question and answer
    // const question = await Question.create({
    //   user: req.user.id, // From auth middleware
    //   content,
    //   answer,
    //   topic: topic || 'Other',
    //   modelAnswerGenerated: true
    // });
    
    return res.status(200).json({
      success: true,
      data: {
        question: content,
        answer,
        relevantPastPapers
      }
    });
    
  } catch (error) {
    console.error('Error processing question:', error);
    
    // Provide a more informative error message based on the type of error
    let errorMessage = 'Failed to process question';
    let statusCode = 500;
    
    if (error.message.includes('OpenAI API error')) {
      errorMessage = 'AI service error: ' + error.message;
    } else if (error.message.includes('OPENAI_API_KEY is not configured')) {
      errorMessage = 'Server configuration error: API key not properly set';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('Network issue')) {
      errorMessage = 'Network error connecting to AI service';
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get a list of all questions (would typically be user-specific)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQuestions = async (req, res) => {
  try {
    // In a real implementation with MongoDB:
    // const questions = await Question.find({ user: req.user.id });
    
    // For demo:
    const demoQuestions = [
      {
        id: '1',
        content: 'How do I apply Newton\'s Second Law to solve for acceleration?',
        answer: 'Newton\'s Second Law states that F = ma, where F is the net force, m is mass, and a is acceleration. To find acceleration, rearrange the formula to a = F/m.',
        topic: 'Mechanics',
        createdAt: new Date('2025-04-11')
      },
      {
        id: '2',
        content: 'What is the difference between physical and chemical changes?',
        answer: 'Physical changes alter a substance\'s appearance but not its composition (e.g., phase changes). Chemical changes create new substances through chemical reactions (e.g., combustion).',
        topic: 'Matter & Materials',
        createdAt: new Date('2025-04-10')
      }
    ];
    
    return res.status(200).json({
      success: true,
      count: demoQuestions.length,
      data: demoQuestions
    });
    
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  processQuestion,
  getQuestions
};
