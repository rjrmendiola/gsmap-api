'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('provinces', [{
      name: 'Leyte',
      slug: 'leyte'
    }]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('provinces', { slug: 'leyte' });
  }
};
