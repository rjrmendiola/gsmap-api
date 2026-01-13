const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const barangayRoutes = require('./routes/barangayRoutes');
const barangayOfficialRoutes = require('./routes/barangayOfficialRoutes');
const evacuationCenterRoutes = require('./routes/evacuationCenterRoutes');
const hazardRiskAssessmentRoutes = require('./routes/hazardRickAssessmentRoutes');
const userRoutes = require('./routes/userRoutes');
const slopeRoutes = require('./routes/slopeRoutes');
const soilMoistureRoutes = require('./routes/soilMoistureRoutes');
// const barangayWeatherRoutes = require('./routes/barangayWeatherRoutes');

const weatherRoutes = require('./routes/weather.routes');
const dssRoutes = require('./routes/dss.routes');
const testDataRoutes = require('./routes/test-data.routes');

dotenv.config();

const app = express();

// Port setup
const PORT = process.env.PORT || 3000;

// JWT Secret Key (should be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/barangays', barangayRoutes);
app.use('/api/barangayofficials', barangayOfficialRoutes);
app.use('/api/evacuationcenters', evacuationCenterRoutes);
app.use('/api/hazardriskAssessments', hazardRiskAssessmentRoutes);
app.use('/api/slopes', slopeRoutes);
app.use('/api/soilmoistures', soilMoistureRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/barangayweathers', barangayWeatherRoutes);

app.use('/api/weather', weatherRoutes);
app.use('/api/dss', dssRoutes);
app.use('/api/test', testDataRoutes);

// Serve uploaded images
app.use('/uploads/evacuation-centers', express.static(path.join(__dirname, 'uploads/evacuation-centers')));

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Join DSS room for real-time updates
  socket.on('join_dss', () => {
    socket.join('dss_room');
    console.log(`Client ${socket.id} joined DSS room`);
  });
});

// Make io available to other modules
app.set('io', io);

// Start real-time weather simulation
const realtimeWeatherService = require('./services/realtime-weather.service');
realtimeWeatherService.start(io);

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on ${PORT}`);
  console.log(`WebSocket server ready`);
});
