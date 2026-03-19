import { isCelebrateError } from 'celebrate';

export const errorHandler = (err, req, res, _next) => {
  if (isCelebrateError(err)) {
    return res.status(400).json({ message: err.message });
  }
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
};
