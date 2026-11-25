const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['conference', 'workshop', 'concert', 'sports', 'meetup', 'other'],
      default: 'other',
    },
    venue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    capacity: { type: Number, required: true, min: [1, 'Capacity must be at least 1'] },
    registeredCount: { type: Number, default: 0, min: 0 },
    price: { type: Number, default: 0, min: [0, 'Price cannot be negative'] },
    status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
