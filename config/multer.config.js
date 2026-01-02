const multer = require('multer');

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

module.exports = {
  dataUpload
};
