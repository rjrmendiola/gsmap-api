'use strict';

const fs = require('fs');
const path = require('path');
const moment = require('moment');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    // Load data from the JSON file
    const rawData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/barangay_officials.json'), 'utf-8')
    );

    // Convert ISO 8601 datetime to MySQL datetime format
    const data = rawData.map(item => ({
      ...item,
      createdAt: moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: moment(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')
    }));


    // Insert data into the table
    await queryInterface.bulkInsert('barangayofficials', data, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    // Remove all records from the table
    await queryInterface.bulkDelete('barangayofficials', null, {});
  }
};
