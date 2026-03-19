import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Library from '../models/Library.js';
import Genre from '../models/Genre.js';
import Resource from '../models/Resource.js';
import Policy from '../models/Policy.js';

dotenv.config();

(async()=>{
  await connectDB();
  await mongoose.connection.dropDatabase();
  await Promise.all([
    User.deleteMany({}), Library.deleteMany({}), Genre.deleteMany({}), Resource.deleteMany({}), Policy.deleteMany({})
  ]);
  const libs = await Library.insertMany([
    { name:'Junior High Library', location:'Bldg A' },
    { name:'Senior High Library', location:'Bldg B' },
    { name:'College Library', location:'Bldg C' }
  ]);
  await Genre.insertMany([
    { name:'Fiction' },{ name:'Non-Fiction'},{ name:'Science'},{ name:'Technology'},{ name:'History'},{ name:'Literature'}
  ]);
  await User.create([
    { role:'developer', fullName:'System Developer', employeeId:'DEV-001', password:'admin123', firstLogin:true },
    { role:'librarian', fullName:'Lib Admin - Junior High', employeeId:'LIB-001', library: libs[0]._id, password:'admin123', firstLogin:true },
    { role:'student', fullName:'Juan Dela Cruz', schoolId:'2023-001', course:'BSIT', yearLevel:'3', password:'password123', firstLogin:true, library: libs[2]._id },
    { role:'personnel', fullName:'Maria Santos', employeeId:'EMP-001', department:'Registrar', password:'password123', firstLogin:true, library: libs[1]._id }
  ]);
  await Resource.insertMany([
    { title:'Intro to Algorithms', resourceType:'book', author:'CLRS', library:libs[2]._id, quantity:5, availableQuantity:5, barcode:'B0001' },
    { title:'Microscope', resourceType:'gadget', library:libs[1]._id, quantity:2, availableQuantity:2, barcode:'G0001' },
    { title:'Projector', resourceType:'utility', library:libs[0]._id, quantity:3, availableQuantity:3, barcode:'U0001' }
  ]);
  await Policy.insertMany([
    { key:'notice', title:'Notice of Use', description:'Shown to students before reserving an item', content:'Handle items with care. Return on or before due date. Report damage immediately. Do not lend to others. Follow library rules.' },
    { key:'fine', title:'Fine Policy', description:'Fine rates and overdue policies', content:'Overdue items incur ?10/day per resource. Fines must be paid before new borrowing. Lost items require replacement or fee. Damaged items assessed by staff.' },
    { key:'agreement', title:'Borrowing Agreement', description:'Terms and conditions for borrowing', content:'Return items in same condition. Overdue fines will be charged. User is responsible for loss or damage. Follow all library policies.' }
  ]);
  console.log('Seed complete');
  process.exit();
})();
