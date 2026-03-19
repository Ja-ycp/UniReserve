import mongoose from 'mongoose';

const librarySchema = new mongoose.Schema({
  name: { type: String, enum: ['Junior High Library','Senior High Library','College Library'], unique: true },
  location: String,
  rules: {
    booksDays: { type: Number, default: 7 },
    gadgetsDays: { type: Number, default: 3 },
    utilitiesDays: { type: Number, default: 5 }
  }
}, { timestamps: true });

export default mongoose.model('Library', librarySchema);
