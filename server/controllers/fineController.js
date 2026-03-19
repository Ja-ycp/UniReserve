import Fine from '../models/Fine.js';

export const listFines = async (req, res, next) => {
  try { res.json(await Fine.find({ user: req.user.id }).populate('reservation')); }
  catch (e) { next(e); }
};

export const adminListFines = async (_req, res, next) => { try { res.json(await Fine.find().populate({path:'reservation',populate:'resource'}).populate('user')); } catch (e) { next(e); } };

export const markPaid = async (req, res, next) => {
  try {
    const fine = await Fine.findByIdAndUpdate(req.params.id, { paid: true }, { new: true });
    res.json(fine);
  } catch (e) { next(e); }
};
