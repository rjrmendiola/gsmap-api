const db = require('../models');
const { Barangay, BarangayOfficial } = require('../models');
const importParser = require('../services/import-parser.service');
const { EvacuationCenter, EvacuationCenterImage } = require('../models');
const fs = require('fs');
const path = require('path');
const { get } = require('http');

const REQUIRED_FIELDS = ['name', 'barangay', 'latitude', 'longitude', 'venue'];

// TODO: Dynamically get municipality ID
const MUNICIPALITY_ID = 1;

async function importData(req, res) {

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

// Upload evacuation center image
async function uploadImage(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const imagePath = `/assets/evacuation-centers/${req.file.filename}`;

        const image = await EvacuationCenterImage.create({
            evacuation_center_id: req.body.evacuation_center_id,
            image_path: imagePath,
            order_index: 0
        });

        res.json({ success: true, image });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Upload evacuation center multiple images
async function uploadImages(req, res) {
    try {
        const { evacuation_center_id } = req.params;

        if (!req.files || !req.files.length) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const images = req.files.map(file => ({
            evacuation_center_id,
            image_path: `evacuation-centers/${evacuation_center_id}/${file.filename}`,
            is_primary: false
        }));

        await EvacuationCenterImage.bulkCreate(images);

        // const hasPrimary = await EvacuationCenterImage.findOne({
        //     where: { evacuation_center_id, is_primary: true }
        // });

        // if (!hasPrimary && images.length) {
        //     await EvacuationCenterImage.update(
        //         { is_primary: true },
        //         { where: { id: images[0].id } }
        //     );
        // }

        res.status(201).json({
            message: 'Images uploaded successfully',
            count: images.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Upload failed' });
    }
}

// Get all images for an evacuation center
async function getImages(req, res) {
    try {
        const images = await EvacuationCenterImage.findAll({
            where: { evacuation_center_id: req.params.evacuation_center_id },
            order: [['order_index', 'ASC']]
        });
        res.json(images);

        // const { evacuation_center_id } = req.params;

        // const images = await EvacuationCenterImage.findAll({
        //     where: { evacuation_center_id },
        //     include: [
        //         {
        //         model: EvacuationCenter,
        //         attributes: ['id', 'name']
        //         }
        //     ],
        //     order: [['is_primary', 'DESC'], ['created_at', 'ASC']]
        // });

        // res.json(images);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function deleteImage(req, res) {
    try {
        const image = await EvacuationCenterImage.findByPk(req.params.id);
        if (!image) return res.status(404).json({ error: 'Image not found' });

        // Delete file from disk
        const filePath = path.join(__dirname, '../uploads/evacuation-centers', path.basename(image.image_path));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await image.destroy();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function setPrimaryImage(req, res) {
    try {
        const imageId = req.body.image_id;
        const image = await EvacuationCenterImage.findByPk(imageId);
        if (!image) return res.status(404).json({ error: 'Image not found' });
        await EvacuationCenterImage.update(
            { is_primary: false },
            { where: { evacuation_center_id: image.evacuation_center_id } }
        );
        image.is_primary = true;
        await image.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { importData, uploadImage, uploadImages, getImages, deleteImage, setPrimaryImage };