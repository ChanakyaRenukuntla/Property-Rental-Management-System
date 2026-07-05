// routes/property.routes.js

const express = require('express');
const router  = express.Router();

const {
  getProperties, getProperty, createProperty,
  updateProperty, deleteProperty, assignTenant, bookProperty
} = require('../controllers/property.controller');

const { protect, authorize } = require('../middleware/auth');

// All routes below require the user to be logged in (protect)
router.use(protect);

// GET  /api/properties       → Get all properties
// POST /api/properties       → Add new property (owners only)
router
  .route('/')
  .get(getProperties)
  .post(authorize('owner'), createProperty);

// GET    /api/properties/:id → Get one property
// PUT    /api/properties/:id → Update property (owners only)
// DELETE /api/properties/:id → Delete property (owners only)
router
  .route('/:id')
  .get(getProperty)
  .put(authorize('owner'), updateProperty)
  .delete(authorize('owner'), deleteProperty);

// PUT /api/properties/:id/assign-tenant → Assign tenant (owners only)
router.put('/:id/assign-tenant', authorize('owner'), assignTenant);

// POST /api/properties/:id/book → Tenant pays and books a property
router.post('/:id/book', bookProperty);

module.exports = router;
