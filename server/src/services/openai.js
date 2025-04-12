const { OpenAI } = require('openai');
const dotenv = require('dotenv');
dotenv.config();

// Initialize OpenAI with API key from environment variables
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('WARNING: OPENAI_API_KEY is not set in environment variables!');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

/**
 * Generate a response using OpenAI's API
 * @param {string} question - The student's question
 * @param {string} topic - The topic of the question (e.g., Mechanics, Chemical Change)
 * @param {object} context - Additional context like past paper references
 * @returns {Promise<string>} - The generated response
 */
const generateResponse = async (question, topic = '', context = {}) => {
  try {
    // Log info about the environment for debugging
    console.log('OpenAI Service - Environment:', { 
      NODE_ENV: process.env.NODE_ENV,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      API_KEY_SET: !!apiKey
    });

    // Make sure we have an API key
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured. Please check your environment variables.');
    }
    
    const systemPrompt = `You are a helpful AI tutor specializing in South African Grade 12 Physical Science. 
    Your goal is to help students understand concepts and solve problems according to the CAPS curriculum.
    Always provide step-by-step explanations with relevant formulas and diagrams when appropriate.
    Use South African curriculum-specific terminology and examples.
    
    ${topic ? `This question relates to the topic: ${topic}.` : ''}
    ${context.pastPapers ? `Reference relevant questions from past papers: ${JSON.stringify(context.pastPapers)}` : ''}`;

    console.log('OpenAI Service - Preparing to send request with model:', process.env.OPENAI_MODEL || 'gpt-4-turbo');
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    if (!response.choices || response.choices.length === 0) {
      console.error('OpenAI Service - Unexpected response format:', response);
      throw new Error('Received invalid response format from OpenAI');
    }

    return response.choices[0].message.content;
  } catch (error) {
    // Provide more detailed error logging
    console.error('Error generating response from OpenAI:', error);
    
    // Log the specific error details based on error type
    if (error.response) {
      // The request was made and the API responded with a status code outside of 2xx
      console.error('OpenAI API error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      throw new Error(`OpenAI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response received
      console.error('OpenAI request was made but no response received');
      throw new Error('No response received from OpenAI API. Network issue or timeout.');
    } else {
      // Something else caused the error
      console.error('OpenAI setup error:', error.message);
      throw new Error(`OpenAI setup error: ${error.message}`);
    }
  }
};

module.exports = {
  generateResponse
};
