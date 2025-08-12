require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import routes
const projectRoutes = require('./routes/projects');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    gcp: {
      project: process.env.GOOGLE_CLOUD_PROJECT,
      firestore: process.env.FIRESTORE_DATABASE_ID,
      storage: process.env.GCS_BUCKET_NAME,
      pubsub: process.env.PUBSUB_TOPIC_NAME
    }
  });
});

// API routes
app.use('/api/projects', projectRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 100MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TheNeural Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 GCP Project: ${process.env.GOOGLE_CLOUD_PROJECT || 'Not set'}`);
  console.log(`🗄️  Firestore: ${process.env.FIRESTORE_DATABASE_ID || 'Not set'}`);
  console.log(`🪣 Storage: ${process.env.GCS_BUCKET_NAME || 'Not set'}`);
  console.log(`📢 Pub/Sub: ${process.env.PUBSUB_TOPIC_NAME || 'Not set'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
