const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dataUpload = multer({
  storage: multer.memoryStorage(), // store file in memory only
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only CSV or Excel files are allowed'));
    }

    cb(null, true);
  }
});

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, '../uploads/evacuation-centers');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const centerId = req.params.evacuation_center_id;
    const centerDir = path.join(uploadFolder, centerId);

    if (!fs.existsSync(centerDir)) {
      fs.mkdirSync(centerDir, { recursive: true });
    }

    cb(null, centerDir);
  },
  // destination: (req, file, cb) => {
  //   cb(null, uploadFolder);
  // },
  filename: (req, file, cb) => {
    // const uniqueName = `evac_${req.body.evacuation_center_id}_${Date.now()}${path.extname(file.originalname)}`;
    // const centerId = req.params.evacuation_center_id;

    // const uniqueName = `evac_${centerId}_${Date.now()}${path.extname(file.originalname)}`;
    // cb(null, uniqueName);
    cb(null, `${file.originalname}`);
  }
});

const imageUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

module.exports = {
  dataUpload,
  imageUpload
};
