// Simple health check endpoint for Vercel
module.exports = (req, res) => {
  // Return environment info but not sensitive values
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    // Only show if keys are configured, not their values
    OPENAI_API_KEY_SET: !!process.env.OPENAI_API_KEY,
    OPENAI_MODEL_SET: !!process.env.OPENAI_MODEL
  };

  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    environment: envInfo,
    timestamp: new Date().toISOString()
  });
};
