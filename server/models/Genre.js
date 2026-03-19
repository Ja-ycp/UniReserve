import mongoose from 'mongoose';

const genreSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  description: String
}, { timestamps: true });

export default mongoose.model('Genre', genreSchema);
