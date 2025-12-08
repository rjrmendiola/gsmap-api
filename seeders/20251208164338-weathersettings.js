'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const timestamp = new Date();
    
      await queryInterface.bulkInsert('WeatherSettings', [{
        refresh_interval_minutes: 30,
        created_at: timestamp,
        updated_at: timestamp
      }]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('WeatherSettings', { refresh_interval_minutes: 30 });
  }
};
