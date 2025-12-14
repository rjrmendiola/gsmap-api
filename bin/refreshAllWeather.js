#!/usr/bin/env node
require('dotenv').config();
const { Barangay } = require('../models');
const { forceFetchAndSave } = require('../services/weatherService');

(async function() {
  const barangays = await Barangay.findAll({ attributes: ['id'] });
  for (const b of barangays) {
    console.log('Refreshing', b.id);
    await forceFetchAndSave(b.id);
  }
  console.log('Done');
  process.exit(0);
})();
