const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const questionsRoutes = require('./routes/questions');
const papersRoutes = require('./routes/papers');
const conceptsRoutes = require('./routes/concepts');

// Initialize app
const app = express();
// Force port 5002 to avoid conflicts with other applications
const PORT = 5002;

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(limiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/papers', papersRoutes);
app.use('/api/concepts', conceptsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve static files from the React build directory in production
if (process.env.NODE_ENV === 'production') {
  // Adjust path for Vercel deployment
  const clientBuildPath = path.join(__dirname, '../../../client/build');
  
  // Check if the build directory exists
  if (fs.existsSync(clientBuildPath)) {
    console.log(`Serving static files from: ${clientBuildPath}`);
    
    // Serve static files
    app.use(express.static(clientBuildPath));
    
    // Serve the index.html for any unknown paths (client-side routing)
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  } else {
    console.warn(`Client build directory not found at: ${clientBuildPath}`);
  }
}

// Export app for serverless deployment
module.exports = app;

// Start the server only in development mode or when not in a serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.SERVER_TYPE === 'standard') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in demo mode (no MongoDB connection)`);
    console.log('Note: Database features are simulated for demonstration purposes');
  });
}

// In a production environment, you would connect to MongoDB like this:
// mongoose
//   .connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log('Connected to MongoDB');
//     // Start the server after successful connection
//   })
//   .catch((error) => {
//     console.error('MongoDB connection error:', error);
//   });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
