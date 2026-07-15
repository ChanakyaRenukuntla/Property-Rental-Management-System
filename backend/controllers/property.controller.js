// ============================================================
// controllers/property.controller.js
// Handles all property-related API logic
// ============================================================

const Property = require('../models/Property');

// -------------------------------------------------------
// @route   GET /api/properties
// @desc    Get all properties
//          - Owner gets THEIR properties
//          - Tenant gets ALL available properties
// @access  Private
// -------------------------------------------------------
exports.getProperties = async (req, res) => {
  try {
    let query;

    if (req.user.role === 'owner') {
      // Owner sees only their own properties
      query = Property.find({ owner: req.user._id });
    } else {
      // Tenant sees all properties (to browse and find a home)
      query = Property.find();
    }

    // .populate() replaces the owner ID with the actual owner's name/email
    const properties = await query
      .populate('owner', 'name email phone')
      .populate('currentTenant', 'name email')
      .sort({ createdAt: -1 }); // newest first

    res.json({ success: true, count: properties.length, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------
// @route   GET /api/properties/:id
// @desc    Get a single property by ID
// @access  Private
// -------------------------------------------------------
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('currentTenant', 'name email');

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------
// @route   POST /api/properties
// @desc    Create a new property (Owner only)
// @access  Private + Owner role
// -------------------------------------------------------
exports.createProperty = async (req, res) => {
  try {
    // Automatically set the owner to the logged-in user
    req.body.owner = req.user._id;

    const property = await Property.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Property added successfully!',
      property
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------
// @route   PUT /api/properties/:id
// @desc    Update a property (Owner only, must own it)
// @access  Private + Owner role
// -------------------------------------------------------
exports.updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    // Security check: make sure the logged-in owner owns this property
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this property.' });
    }

    // { new: true } returns the updated document
    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, message: 'Property updated!', property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------
// @route   DELETE /api/properties/:id
// @desc    Delete a property (Owner only, must own it)
// @access  Private + Owner role
// -------------------------------------------------------
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this property.' });
    }

    await property.deleteOne();

    res.json({ success: true, message: 'Property deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------
// @route   PUT /api/properties/:id/assign-tenant
// @desc    Assign a tenant to a property (Owner only)
// @access  Private + Owner role
// -------------------------------------------------------
exports.assignTenant = async (req, res) => {
  try {
    const { tenantId } = req.body;

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { currentTenant: tenantId, status: tenantId ? 'occupied' : 'available' },
      { new: true }
    ).populate('currentTenant', 'name email');

    res.json({ success: true, message: 'Tenant assigned!', property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------
// @route   POST /api/properties/:id/book
// @desc    Tenant pays and books an available property
// @access  Private
// -------------------------------------------------------
exports.bookProperty = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const property = await Property.findById(req.params.id);

    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    if (property.status !== 'available') return res.status(400).json({ success: false, message: 'Property is no longer available. It may have been booked by someone else.' });

    // Ensure the tenant hasn't already booked another property
    const currentlyOccupying = await Property.findOne({ currentTenant: req.user._id, status: 'occupied' });
    if (currentlyOccupying) {
      return res.status(400).json({ success: false, message: 'You have already booked a property. A tenant can only book one property at a time.' });
    }

    // 1. Mark property as occupied
    property.status = 'occupied';
    property.currentTenant = req.user._id;
    await property.save();

    // 2. Create Payment Record (Rent + Deposit)
    const Payment = require('../models/Payment');
    
    // Map frontend payment strings to backend enum
    let validMethod = 'online';
    if (['cash', 'bank_transfer', 'upi', 'cheque', 'online'].includes(paymentMethod)) {
      validMethod = paymentMethod;
    } else if (paymentMethod === 'netbanking') {
      validMethod = 'bank_transfer';
    } else if (paymentMethod === 'card') {
      validMethod = 'online';
    }

    await Payment.create({
      property: property._id,
      tenant: req.user._id,
      owner: property.owner,
      amount: property.rent + (property.deposit || 0),
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      method: validMethod,
      status: 'paid',
      paidOn: new Date(),
      notes: 'Initial booking payment (Rent + Deposit)'
    });

    res.json({ success: true, message: 'Property successfully booked!', property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
