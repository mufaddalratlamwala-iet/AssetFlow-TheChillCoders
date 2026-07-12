const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', activityLogController.getLogs);

module.exports = router;
