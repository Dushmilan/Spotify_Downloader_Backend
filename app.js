// app.js - MVC Implementation
const express = require('express');
const cors = require('cors');
const path = require('path');
const spotifyRoutes = require('./routes/spotifyRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // View layer - static files

// Routes
app.use('/', spotifyRoutes); // Controller layer handles routing

module.exports = { app, port };