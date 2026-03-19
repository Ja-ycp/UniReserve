import mongoose from 'mongoose';

const policySchema = new mongoose.Schema({
  title: { type:String, required:true },
  description: String,
  content: String,
  key: { type:String, unique:true } // optional stable key like notice,fine,agreement
}, { timestamps:true });

export default mongoose.model('Policy', policySchema);
