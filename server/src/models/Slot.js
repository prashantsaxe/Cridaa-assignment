import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  court: {
    type: String,
    required: true
  },
  booked: {
    type: Boolean,
    default: false
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bookedAt: {
    type: Date,
    default: null
  },
  price: {
    type: Number,
    default: 1000
  },
  duration: {
    type: String,
    default: '1 hour'
  }
}, {
  timestamps: true
});

export default mongoose.model('Slot', slotSchema);
