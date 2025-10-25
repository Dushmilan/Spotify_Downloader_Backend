const express = require('express');
const cors = require('cors');
const config = require('./src/config/config');
const logger = require('./src/utils/logger');
const spotifyRoutes = require('./src/routes/spotifyRoutes');
const youtubeRoutes = require('./src/routes/youtubeRoutes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes
app.use('/api/spotify', spotifyRoutes);
app.use('/api/youtube', youtubeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port || 3000;
app.listen(PORT, () => {
  logger.info(`Spotify Downloader Server running on port ${PORT}`);
  console.log(`Spotify Downloader Server running on port ${PORT}`);
});

module.exports = app;