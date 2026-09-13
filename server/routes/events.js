const express = require('express');
const { listEvents, getEventFilters, getEvent, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', listEvents);
router.get('/filters', getEventFilters);
router.get('/:id', getEvent);
router.post('/', requireAuth, requireAdmin, createEvent);
router.put('/:id', requireAuth, requireAdmin, updateEvent);
router.delete('/:id', requireAuth, requireAdmin, deleteEvent);

module.exports = router;
