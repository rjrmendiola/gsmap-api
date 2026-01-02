const db = require('../models');
const { Barangay, BarangayOfficial } = require('../models');
const importParser = require('../services/import-parser.service');

const REQUIRED_FIELDS = ['name', 'barangay', 'latitude', 'longitude', 'venue'];

// TODO: Dynamically get municipality ID
const MUNICIPALITY_ID = 1;

async function importEvacuationCenterData(req, res) {

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

        const barangayOfficials = await BarangayOfficial.findAll({
            attributes: ['id', 'barangay_id']
        });

        const barangayOfficialByBarangayId = new Map(
            barangayOfficials.map(o => [o.barangay_id, o.id])
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

            const latitude = parseFloat(row.latitude);
            const longitude = parseFloat(row.longitude);

            if (isNaN(latitude) || isNaN(longitude)) {
                failed.push({
                    row: index + 2,
                    reason: 'Invalid latitude or longitude',
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

            const officialid = barangayOfficialByBarangayId.get(barangay.id);

            if (!officialid) {
                failed.push({
                    row: index + 2,
                    reason: `Barangay official not found for barangay: ${barangayName}`,
                    data: row
                });
                return;
            }

            success.push({
                row: index + 2,
                data: {
                    name: row.name,
                    latitude,
                    longitude,
                    barangay_id: barangay.id,
                    barangay_official_id: officialid,
                    venue: row.venue
                }
            });
        });

        /* =========================
            DATABASE INSERT
        ========================= */
        if (success.length) {
            await db.EvacuationCenter.bulkCreate(
                success.map(s => s.data),
                {
                    transaction,
                    ignoreDuplicates: true
                }
            );
        }

        await transaction.commit();

        res.json({
            message: 'Evacuation center import completed',
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

module.exports = { importEvacuationCenterData };