const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
