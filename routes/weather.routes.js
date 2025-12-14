const router = require('express').Router();
const controller = require('../controllers/weather.controller');

router.get('/', controller.getAll);

module.exports = router;
