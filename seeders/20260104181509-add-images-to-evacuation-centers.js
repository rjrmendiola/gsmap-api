'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { EvacuationCenter } = require('../models');

    const centers = await EvacuationCenter.findAll({
      attributes: ['id', 'name', 'barangay_id', 'image'],
    });

    for (const center of centers) {
      if (center.image) {
        await queryInterface.bulkInsert('evacuation_center_images', [
          {
            evacuation_center_id: center.id,
            image_path: 'evacuation-centers/' + center.id + '/' + center.image,
            is_primary: true,
            order_index: 1,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('evacuation_center_images', null, {});
  }
};
