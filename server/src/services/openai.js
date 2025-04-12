const { OpenAI } = require('openai');
const dotenv = require('dotenv');
dotenv.config();

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    const systemPrompt = `You are a helpful AI tutor specializing in South African Grade 12 Physical Science. 
    Your goal is to help students understand concepts and solve problems according to the CAPS curriculum.
    Always provide step-by-step explanations with relevant formulas and diagrams when appropriate.
    Use South African curriculum-specific terminology and examples.
    
    ${topic ? `This question relates to the topic: ${topic}.` : ''}
    ${context.pastPapers ? `Reference relevant questions from past papers: ${JSON.stringify(context.pastPapers)}` : ''}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response from OpenAI:', error);
    throw new Error('Failed to generate response');
  }
};

module.exports = {
  generateResponse
};
