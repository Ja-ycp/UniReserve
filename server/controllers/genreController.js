import Genre from '../models/Genre.js';
import Resource from '../models/Resource.js';

export const listGenres = async (_req, res, next) => { try { res.json(await Genre.find()); } catch (e) { next(e); } };
export const createGenre = async (req, res, next) => { try { res.status(201).json(await Genre.create(req.body)); } catch (e) { next(e); } };
export const updateGenre = async (req, res, next) => { try { res.json(await Genre.findByIdAndUpdate(req.params.id, req.body, { new:true })); } catch (e) { next(e); } };
export const deleteGenre = async (req, res, next) => {
  try {
    await Resource.updateMany({ genre: req.params.id }, { $unset: { genre: 1 } });
    await Genre.findByIdAndDelete(req.params.id);
    res.json({ message:'Deleted' });
  } catch (e) { next(e); }
};
