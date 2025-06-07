// app.js lub server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const prayerRoutes = require('./routes/prayers');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // maksymalnie 100 zapytań na IP
  message: {
    error: 'Zbyt wiele zapytań z tego IP, spróbuj ponownie później.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://twoja-domena.com'] 
    : ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/prayers', prayerRoutes);

// Catch 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint nie został znaleziony'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Błąd serwera:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Wystąpił błąd serwera'
      : error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Serwer OREMUS działa na porcie ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;