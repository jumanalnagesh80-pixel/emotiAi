const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Routes
app.use('/api', apiRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '../frontend' });
});

app.get('/emotion-detection', (req, res) => {
    res.sendFile('emotion-detection.html', { root: '../frontend' });
});

app.get('/sentiment-analysis', (req, res) => {
    res.sendFile('sentiment-analysis.html', { root: '../frontend' });
});

app.get('/adaptive-responses', (req, res) => {
    res.sendFile('adaptive-responses.html', { root: '../frontend' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
});