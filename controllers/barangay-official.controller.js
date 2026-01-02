const db = require('../models');
const { Barangay, BarangayOfficial } = require('../models');
const slugify = require('../utils/slugifier.utils');
const importParser = require('../services/import-parser.service');

const REQUIRED_FIELDS = ['name', 'position', 'barangay'];

// TODO: Dynamically get municipality ID
const MUNICIPALITY_ID = 1;

async function importBarangayOfficialData(req, res) {
    if (!db || !db.sequelize) {
      throw new Error('Sequelize not initialized correctly');
    }

    const transaction = await db.sequelize.transaction();

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        let rows = [];

        /* =========================
            PARSE FILE
        ========================= */
        if (req.file.mimetype === 'text/csv') {
            rows = await importParser.parseCSV(req.file.buffer);
        } else {
            rows = await importParser.parseExcel(req.file.buffer);
        }

        /* =========================
            VALIDATION & REPORT
        ========================= */
        const success = [];
        const failed = [];

        const barangays = await Barangay.findAll({
          attributes: ['id', 'name']
        });

        const barangayMap = new Map(
            barangays.map(b => [b.name.toLowerCase(), b])
        );


        rows.forEach((row, index) => {
            const missing = REQUIRED_FIELDS.filter(f => !row[f]);

            if (missing.length) {
                failed.push({
                    row: index + 2,
                    reason: `Missing fields: ${missing.join(', ')}`,
                    data: row
                });

                return;
            }

            let barangayName = row.barangay.trim();
            const barangay = barangayMap.get(barangayName.toLowerCase());

            if (!barangay) {
                failed.push({
                    row: index + 2,
                    reason: `Barangay not found: ${barangayName}`,
                    data: row
                });

                return;
            }

            success.push({
                row: index + 2,
                data: {
                    name: row.name,
                    position: row.position,
                    barangay_id: barangay.id
                }
            });
        });

        /* =========================
            DATABASE INSERT
        ========================= */
        if (success.length) {
            await db.BarangayOfficial.bulkCreate(
                success.map(s => s.data),
                {
                    transaction,
                    ignoreDuplicates: true
                }
            );
        }

        await transaction.commit();

        res.json({
            message: 'Barangay official import completed',
            summary: {
                total: rows.length,
                inserted: success.length,
                failed: failed.length
            },
            success,
            failed
        });

        } catch (error) {
        await transaction.rollback();

        res.status(500).json({
            message: 'Import failed',
            error: error.message
        });
    }
}

module.exports = { importBarangayOfficialData };