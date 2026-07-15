const BookingRequest = require('../models/BookingRequest');
const Property = require('../models/Property');
const Message = require('../models/Message');

exports.createRequest = async (req, res) => {
  try {
    const { propertyId, message, isExternal, externalTitle } = req.body;
    
    // Check if the tenant already successfully booked and occupies a property
    const currentlyOccupying = await Property.findOne({ currentTenant: req.user._id, status: 'occupied' });
    if (currentlyOccupying) {
      return res.status(400).json({ success: false, message: 'You have already booked a property. A tenant can only book one property at a time.' });
    }

    if (isExternal) {
      // Check if already requested this external place
      const existingExt = await BookingRequest.findOne({
        isExternal: true,
        tenant: req.user._id,
        externalTitle: externalTitle || 'Unknown Location'
      });
      if (existingExt) {
        return res.status(400).json({ success: false, message: 'You have already sent a request for this place.' });
      }

      const newRequest = await BookingRequest.create({
        tenant: req.user._id,
        isExternal: true,
        externalTitle: externalTitle || 'Unknown Location',
        message: message || ''
      });
      return res.status(201).json({ success: true, request: newRequest });
    }

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    if (property.status !== 'available') return res.status(400).json({ success: false, message: 'Property is not available.' });

    // Check if already requested (prevent duplicate requests for the same property)
    const existing = await BookingRequest.findOne({
      property: propertyId,
      tenant: req.user._id
    });
    if (existing) return res.status(400).json({ success: false, message: 'You have already sent a request for this property.' });

    const newRequest = await BookingRequest.create({
      property: propertyId,
      tenant: req.user._id,
      owner: property.owner,
      message: message || ''
    });

    res.status(201).json({ success: true, request: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'owner') {
      query.owner = req.user._id;
    } else {
      query.tenant = req.user._id;
    }

    const requests = await BookingRequest.find(query)
      .populate('property', 'title address rent deposit type status paymentOptions')
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email phone')
      .sort('-createdAt');

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const request = await BookingRequest.findById(req.params.id)
      .populate('property')
      .populate('tenant');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (!request.owner || request.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    request.status = status;
    await request.save();

    // If accepted, send an automatic message to start the chat
    if (status === 'accepted') {
      // Mark property as occupied? No, let them finalize in chat first.
      // Send an auto-message from Owner to Tenant
      const placeName = request.isExternal ? request.externalTitle : request.property?.title;
      await Message.create({
        sender: req.user._id,
        receiver: request.tenant._id,
        text: `Hello ${request.tenant.name}, I have accepted your request for ${placeName || 'your inquiry'}. Let's chat!`
      });
    }

    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
