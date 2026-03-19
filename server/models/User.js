import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['developer','librarian','student','personnel'], required: true },
  fullName: { type: String, required: true },
  schoolId: { type: String, unique: true, sparse: true },
  employeeId: { type: String, unique: true, sparse: true },
  course: String,
  yearLevel: String,
  department: String,
  password: { type: String, required: true },
  library: { type: mongoose.Schema.Types.ObjectId, ref: 'Library' },
  profilePhoto: String,
  firstLogin: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastFailedLoginAt: Date,
  lastLoginAt: Date
}, { timestamps: true });

userSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(pw){
  return bcrypt.compare(pw, this.password);
};

export default mongoose.model('User', userSchema);
