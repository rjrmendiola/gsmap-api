'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { Province } = require('../models');

    const province = await Province.findOne({
      where: { slug: 'leyte' }
    });

    if (province) {
      await queryInterface.bulkInsert('municipalities', [{
        name: 'Carigara',
        slug: 'carigara',
        province_id: province.id
      }]);
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('municipalities', { slug: 'carigara' });
  }
};
