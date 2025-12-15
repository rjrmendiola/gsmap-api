'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const barangayDetails = [
      { name: 'bagong_lipunan', pop_density: 785.20, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.7703 },
      { name: 'balilit', pop_density: 1608.54, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.6078 },
      { name: 'barayong', pop_density: 382.25, livelihood: 'Agriculture/Crops mainly sugar', area: 0.879 },
      { name: 'barugohay_central', pop_density: 3213.58, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.354 },
      { name: 'barugohay_norte', pop_density: 4041.65, livelihood: 'Fishery/Fish Ponds and Mangroves', area: 0.497 },
      { name: 'barugohay_sur', pop_density: 839.23, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.30 },
      { name: 'baybay', pop_density: 22265.7, livelihood: 'Fishery/Trading', area: 0.1029 },
      { name: 'binibihan', pop_density: 1426.7, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.974 },
      { name: 'bislig', pop_density: 837.13, livelihood: 'Agriculture/Crops mainly cereals and sugar', area: 0.845 },
      { name: 'caghalo', pop_density: 3245.51, livelihood: 'Agriculture/Coconut Plantation', area: 0.4135 },
      { name: 'camansi', pop_density: 534.71, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 2.42 },
      { name: 'canal', pop_density: 2658.23, livelihood: 'Agriculture/Crops mainy cereals and sugar', area: 0.316 },
      { name: 'candigahub', pop_density: 1767.3, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.587 },
      { name: 'canfabi', pop_density: 1056, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.4215 },
      { name: 'canlampay', pop_density: 512.6, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 2.46 },
      { name: 'cogon', pop_density: 1010.48, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.743 },
      { name: 'cutay', pop_density: 948.11, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.06 },
      { name: 'east_visoria', pop_density: 29030.53, livelihood: 'Fishery', area: 0.0389 },
      { name: 'guindapunan_east', pop_density: 4379.5, livelihood: 'Fishery', area: 0.2435 },
      { name: 'guindapunan_west', pop_density: 2499.86, livelihood: 'Fishery', area: 0.2703 },
      { name: 'hiluctogan', pop_density: 172.71, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 5.02 },
      { name: 'jugaban', pop_density: 33854, livelihood: 'Fishery/Trading', area: 0.0545 },
      { name: 'libo', pop_density: 583.51, livelihood: 'Agriculture/Coconut Plantation', area: 1.88 },
      { name: 'lower_hiraan', pop_density: 1097.73, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.442 },
      { name: 'lower_sogod', pop_density: 1427.3, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.436 },
      { name: 'macalpi', pop_density: 820.29, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.38 },
      { name: 'manloy', pop_density: 930.60, livelihood: 'Agriculture/Coconut Plantation', area: 1.34 },
      { name: 'nauguisan', pop_density: 2800.57, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.352 },
      { name: 'paglaum', pop_density: 162.57, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.71 },
      { name: 'pangna', pop_density: 850.85, livelihood: 'Agriculture/Coconut Plantation', area: 1.18 },
      { name: 'parag-um', pop_density: 1646.15, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.30 },
      { name: 'parena', pop_density: 2111.83, livelihood: 'Fishery/Fishponds and Mangroves', area: 0.381 },
      { name: 'piloro', pop_density: 535.71, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.12 },
      { name: 'ponong', pop_density: 47184, livelihood: 'Trading', area: 0.0515 },
      { name: 'rizal', pop_density: 703.38, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.5167 },
      { name: 'sagkahan', pop_density: 7238.97, livelihood: 'Agriculture/Crops mainly cereals and sugar', area: 0.741 },
      { name: 'san_isidro', pop_density: 73.7, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 4.85 },
      { name: 'san_juan', pop_density: 862.07, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.435 },
      { name: 'san_mateo', pop_density: 59494.17, livelihood: 'Fishery/Trading', area: 0.01897 },
      { name: 'santa_fe', pop_density: 1014.02, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.542 },
      { name: 'sawang', pop_density: 27300.35, livelihood: 'Trading', area: 0.0854 },
      { name: 'tagak', pop_density: 907.59, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.366 },
      { name: 'tangnan', pop_density: 2746.05, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.304 },
      { name: 'tigbao', pop_density: 864.0, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.676 },
      { name: 'tinaguban', pop_density: 527.38, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 2.52 },
      { name: 'upper_hiraan', pop_density: 776.56, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 1.28 },
      { name: 'upper_sogod', pop_density: 2648.2, livelihood: 'Agriculture/Crops mixed with Coconut Plantation', area: 0.2647 },
      { name: 'uyawan', pop_density: 1551.0, livelihood: 'Agriculture/Crops mainly cereals and sugar', area: 0.6667 },
      { name: 'west_visoria', pop_density: 9110.7, livelihood: 'Fishery', area: 0.1593 },
    ];

    // for (const detail of barangayDetails) {
    //   const barangay = await queryInterface.sequelize.query(
    //     `SELECT id FROM barangays WHERE slug = :slug LIMIT 1;`,
    //     {
    //       replacements: { slug: detail.name },
    //       type: Sequelize.QueryTypes.SELECT,
    //     }
    //   );

    //   if (barangay.length > 0) {
    //     await queryInterface.bulkInsert('barangay_profiles', [{
    //       barangay_id: barangay[0].id,
    //       area: detail.area,
    //       population_density: detail.pop_density,
    //       livelihood: detail.livelihood,
    //       // created_at: new Date(),
    //       // updated_at: new Date(),
    //     }]);
    //   }
    // }

    // 1️⃣ Load barangays
    const barangays = await queryInterface.sequelize.query(
      `SELECT id, slug FROM barangays`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // 2️⃣ Map name → id
    const barangayMap = {};
    barangays.forEach(b => {
      barangayMap[b.slug] = b.id;
    });

    // 3️⃣ Build rows for insertion
    const now = new Date();

    const rows = barangayDetails
      .filter(b => barangayMap[b.name]) // safety check
      .map(b => ({
        barangay_id: barangayMap[b.name],
        population_density: b.pop_density,
        livelihood: b.livelihood,
        area: b.area,
        created_at: new Date(),
        updated_at: new Date()
      }));

    if (!rows.length) {
      console.log('⚠️ No barangay profiles to insert');
      return;
    }

    // 4️⃣ Bulk insert
    await queryInterface.bulkInsert(
      'barangay_profiles', 
      rows,
      { ignoreDuplicates: true }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('barangay_profiles', null, {});
  }
};
