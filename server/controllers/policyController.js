import Policy from '../models/Policy.js';
import { ApiError } from '../utils/ApiError.js';

export const listPolicies = async (_req,res,next)=>{
  try { res.json(await Policy.find().sort('createdAt')); } catch(e){ next(e); }
};

export const createPolicy = async (req,res,next)=>{
  try { const p = await Policy.create(req.body); res.status(201).json(p);} catch(e){ next(e); }
};

export const updatePolicy = async (req,res,next)=>{
  try {
    const p = await Policy.findByIdAndUpdate(req.params.id, req.body, { new:true });
    if(!p) return next(new ApiError(404,'Policy not found'));
    res.json(p);
  } catch(e){ next(e); }
};

export const deletePolicy = async (req,res,next)=>{
  try { await Policy.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); } catch(e){ next(e); }
};
