// ============================================================
// controllers/tenant.controller.js
// ============================================================

const User     = require('../models/User');
const Property = require('../models/Property');

// GET all tenants (Owner only — gets tenants assigned to their properties)
exports.getTenants = async (req, res) => {
  try {
    // Find all properties owned by this owner that have a tenant
    const properties = await Property.find({
      owner: req.user._id,
      currentTenant: { $ne: null }
    }).populate('currentTenant', 'name email phone createdAt');

    const tenants = properties.map(prop => ({
      ...prop.currentTenant.toObject(),
      property: { id: prop._id, title: prop.title, address: prop.address }
    }));

    res.json({ success: true, tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all users with role 'tenant' (for dropdown when assigning a tenant)
exports.getAllTenantUsers = async (req, res) => {
  try {
    const tenants = await User.find({ role: 'tenant' }).select('name email phone');
    res.json({ success: true, tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET tenant's home (the property they are assigned to)
exports.getMyHome = async (req, res) => {
  try {
    const property = await Property.findOne({ currentTenant: req.user._id })
      .populate('owner', 'name email phone');

    if (!property) {
      return res.json({ success: true, property: null, message: 'No property assigned yet.' });
    }

    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
