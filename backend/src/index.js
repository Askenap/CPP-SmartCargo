require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { initWebSocket } = require('./ws/handler');

const authRoutes = require('./routes/auth');
const cppRoutes = require('./routes/cpp');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cpp', cppRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SmartCargo CPP' });
});

// WebSocket
initWebSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SmartCargo CPP Backend running on port ${PORT}`);
});
