'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const timestamp = new Date();
    
      await queryInterface.bulkInsert('system_settings', [{
        name: 'weather_fetch_interval_minutes',
        value: '60',
        // created_at: timestamp,
        // updated_at: timestamp
      }]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('system_settings', { name: 'weather_fetch_interval_minutes' });
  }
};
