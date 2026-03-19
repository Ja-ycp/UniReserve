import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  status: { type: String, enum: ['pending','approved','rejected','borrowed','returned','overdue','cancelled'], default: 'pending' },
  queuePosition: Number,
  requestedDate: Date,
  dueDate: Date,
  borrowDate: Date,
  returnDate: Date,
  notes: String,
  dueSoonNotified: { type:Boolean, default:false },
  overdueNotified: { type:Boolean, default:false }
}, { timestamps: true });

export default mongoose.model('Reservation', reservationSchema);
