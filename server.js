const express = require('express');
const config = require('./src/utils/config');
const spotifyRoutes = require('./src/routes/spotifyRoutes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/', spotifyRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Spotify Metadata Server running on port ${PORT}`);
});

module.exports = app;