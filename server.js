const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const barangayRoutes = require('./routes/barangayRoutes');
const barangayOfficialRoutes = require('./routes/barangayOfficialRoutes');
const evacuationCenterRoutes = require('./routes/evacuationCenterRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/barangays', barangayRoutes);
app.use('/api/barangayofficials', barangayOfficialRoutes);
app.use('/api/evacuationcenters', evacuationCenterRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
