// ============================================================
// models/Payment.js — Schema for rent payments
// ============================================================

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // RELATIONSHIP: Links payment to a specific property
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },

    // RELATIONSHIP: Links payment to the tenant who paid
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // RELATIONSHIP: Links payment to the owner who receives it
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    month: { type: String }, // e.g. "January 2025"

    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'online'],
      default: 'cash'
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },

    paidOn: { type: Date }, // date when payment was made

    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
