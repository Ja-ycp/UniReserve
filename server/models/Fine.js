import mongoose from 'mongoose';

const fineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Fine', fineSchema);
