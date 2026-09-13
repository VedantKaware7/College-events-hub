const express = require('express');
const {
    sendRegistrationOtp,
    registerForEvent,
    getMyRegistrations,
    getAllRegistrations,
    approveRegistration,
    cancelRegistration,
    getStats
} = require('../controllers/registrationController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/otp', requireAuth, sendRegistrationOtp);
router.post('/', requireAuth, registerForEvent);
router.get('/mine', requireAuth, getMyRegistrations);
router.get('/stats', requireAuth, requireAdmin, getStats);
router.get('/', requireAuth, requireAdmin, getAllRegistrations);
router.put('/:id/approve', requireAuth, requireAdmin, approveRegistration);
router.delete('/:id', requireAuth, cancelRegistration);

module.exports = router;
