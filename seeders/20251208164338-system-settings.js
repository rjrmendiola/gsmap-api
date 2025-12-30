'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('system_settings', [{
      name: 'weather_fetch_interval_minutes',
      value: '60',
    }]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('system_settings', { name: 'weather_fetch_interval_minutes' });
  }
};
