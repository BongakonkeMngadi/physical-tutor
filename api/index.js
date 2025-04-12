// Serverless function for Vercel deployment
// This file redirects API requests to the Express app

// Import the Express app
const app = require('../server/src/index');

// Export the Express app as a serverless function
module.exports = app;
