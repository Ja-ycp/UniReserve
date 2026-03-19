import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  resourceType: { type: String, required: true, trim: true, lowercase: true },
  author: String,
  genre: { type: mongoose.Schema.Types.ObjectId, ref: 'Genre' },
  description: String,
  library: { type: mongoose.Schema.Types.ObjectId, ref: 'Library', required: true },
  quantity: { type: Number, default: 1 },
  availableQuantity: { type: Number, default: 1 },
  barcode: { type: String, unique: true, sparse: true, trim: true },
  coverImage: String
}, { timestamps: true });

export default mongoose.model('Resource', resourceSchema);
