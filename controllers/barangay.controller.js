const ExcelJS = require('exceljs');
const { parse } = require('csv-parse/sync');
const { Readable } = require('stream');

const db = require('../models');
const { Barangay, Municipality } = require('../models');
const slugify = require('../utils/slugifier.utils');

const REQUIRED_FIELDS = ['name', 'latitude', 'longitude'];

// example: Carigara municipality id
const MUNICIPALITY_ID = 1;

async function importBarangayData(req, res) {
    // const municipality = await Municipality.findOne({ where: { name: 'Carigara' } });
    // const MUNICIPALITY_ID = municipality.id;

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
            rows = parse(req.file.buffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
        } else {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(req.file.buffer);

            const worksheet = workbook.worksheets[0];
            const headers = [];

            worksheet.getRow(1).eachCell(cell => {
                headers.push(cell.text.trim().toLowerCase());
            });

            worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
                if (rowNum === 1) return;

                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row.getCell(index + 1).text.trim();
                });

                rows.push(obj);
            });
        }

        /* =========================
            VALIDATION & REPORT
        ========================= */
        const success = [];
        const failed = [];

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

            success.push({
                row: index + 2,
                data: {
                    name: row.name,
                    latitude,
                    longitude,
                    slug: slugify(row.name),
                    municipality_id: MUNICIPALITY_ID
                }
            });
        });

        /* =========================
            DATABASE INSERT
        ========================= */
        if (success.length) {
            await db.Barangay.bulkCreate(
                success.map(s => s.data),
                {
                    transaction,
                    ignoreDuplicates: true
                }
            );
        }

        await transaction.commit();

        res.json({
            message: 'Barangay import completed',
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

module.exports = { importBarangayData };