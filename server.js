const express = require('express');
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

// Serve uploaded images
app.use('/uploads/evacuation-centers', express.static(path.join(__dirname, 'uploads/evacuation-centers')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
