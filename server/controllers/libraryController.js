import Library from '../models/Library.js';

export const listLibraries = async (_req, res, next) => {
  try { res.json(await Library.find()); }
  catch (e) { next(e); }
};

export const updateRules = async (req, res, next) => {
  try {
    const lib = await Library.findByIdAndUpdate(req.params.id, { rules: req.body.rules }, { new: true });
    res.json(lib);
  } catch (e) { next(e); }
};
