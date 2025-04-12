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
    const { content, topic } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Question content is required'
      });
    }
    
    // Search for relevant past paper questions
    const relevantPastPapers = await searchPastPapers(content, topic);
    
    // Generate response using OpenAI and past paper context
    const answer = await generateResponse(content, topic, {
      pastPapers: relevantPastPapers
    });
    
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
    return res.status(500).json({
      success: false,
      message: 'Failed to process question',
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
