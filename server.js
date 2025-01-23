const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const barangayRoutes = require('./routes/barangayRoutes');
const evacuationCenterRoutes = require('./routes/evacuationCenterRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/barangays', barangayRoutes);
app.use('/evacuationcenters', evacuationCenterRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
