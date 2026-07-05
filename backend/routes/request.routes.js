const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  updateRequestStatus
} = require('../controllers/request.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// POST /api/requests - Create a booking request (Tenant)
// GET /api/requests - Get requests (Tenant: my sent ones, Owner: my received ones)
router.route('/')
  .post(authorize('tenant'), createRequest)
  .get(getRequests);

// PUT /api/requests/:id/status - Update status (Owner only)
router.put('/:id/status', authorize('owner'), updateRequestStatus);

module.exports = router;
