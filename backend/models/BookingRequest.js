// ============================================================
// models/BookingRequest.js — Schema for tenant booking requests
// ============================================================

const mongoose = require('mongoose');

const bookingRequestSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: false
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    isExternal: {
      type: Boolean,
      default: false
    },
    externalTitle: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    message: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BookingRequest', bookingRequestSchema);
