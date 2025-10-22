const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { spotifyRoutes } = require('./routes');

// Middleware
const requestLogger = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const validation = require('./middleware/validation');

const app = express();
const port = config.port;

// Use middleware
app.use(requestLogger); // Log requests
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(validation.sanitizeInput); // Sanitize inputs

// Serve static files
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files from public/
app.use('/downloads', express.static(config.downloadsDir)); // Serve downloads

// Routes
app.use('/', spotifyRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = { app, port };