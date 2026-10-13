export function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error.code === 11000) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource ID.' });
  }
  const status = error.statusCode || 500;
  res.status(status).json({ message: status === 500 ? 'Internal server error.' : error.message });
}
