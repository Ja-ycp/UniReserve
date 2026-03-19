import Resource from '../models/Resource.js';
import { ApiError } from '../utils/ApiError.js';

const normalizeResourceType = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const listResources = async (req, res, next) => {
  try {
    const { q, type, library, genre, barcode } = req.query;
    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { barcode: { $regex: q, $options: 'i' } }
      ];
    }
    if (type) filter.resourceType = type;
    if (library) filter.library = library;
    if (genre) filter.genre = genre;
    if (barcode) filter.barcode = barcode;
    res.json(await Resource.find(filter).populate('genre library'));
  } catch (e) { next(e); }
};

export const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('genre library');
    if (!resource) return next(new ApiError(404, 'Resource not found'));
    res.json(resource);
  } catch (e) { next(e); }
};

const normalizePayload = (req)=>{
  const payload = { ...req.body };
  if (payload.resourceType !== undefined) payload.resourceType = normalizeResourceType(payload.resourceType);
  if (payload.quantity !== undefined) payload.quantity = Number(payload.quantity);
  if (payload.availableQuantity !== undefined) payload.availableQuantity = Number(payload.availableQuantity);
  if (payload.availableQuantity === undefined && payload.quantity !== undefined) payload.availableQuantity = payload.quantity;
  if (payload.resourceType !== 'book') {
    payload.author = undefined;
    payload.genre = undefined;
    payload.barcode = undefined;
  }
  return payload;
};

export const createResource = async (req, res, next) => {
  try {
    let payload = normalizePayload(req);
    if (req.user.role === 'librarian') payload.library = req.user.library;
    if (req.file) payload.coverImage = req.file.filename;
    if (!payload.resourceType) throw new ApiError(400, 'Resource type is required');
    if (payload.resourceType === 'book' && !payload.barcode) throw new ApiError(400,'Barcode is required for books');
    const resource = await Resource.create(payload);
    res.status(201).json(resource);
  } catch (e) { next(e); }
};

export const updateResource = async (req, res, next) => {
  try {
    let payload = normalizePayload(req);
    if (req.user.role === 'librarian') payload.library = req.user.library;
    if (req.file) payload.coverImage = req.file.filename;
    const resource = await Resource.findById(req.params.id);
    if (!resource) return next(new ApiError(404,'Resource not found'));
    if (req.user.role === 'librarian' && String(resource.library) !== String(req.user.library)) return next(new ApiError(403,'Cannot edit other libraries'));
    Object.assign(resource, payload);
    if (resource.resourceType !== 'book') {
      resource.author = undefined;
      resource.genre = undefined;
      resource.barcode = undefined;
    }
    if (resource.resourceType === 'book' && !resource.barcode) return next(new ApiError(400, 'Barcode is required for books'));
    if (resource.availableQuantity === undefined || resource.availableQuantity === null) resource.availableQuantity = resource.quantity;
    await resource.save();
    res.json(resource);
  } catch (e) { next(e); }
};

export const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return next(new ApiError(404,'Resource not found'));
    if (req.user.role === 'librarian' && String(resource.library) !== String(req.user.library)) return next(new ApiError(403,'Cannot delete other libraries'));
    await resource.deleteOne();
    res.json({ message:'Deleted' });
  } catch (e) { next(e); }
};
