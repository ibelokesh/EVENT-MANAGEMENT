exports.notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  console.error(err);
  let status = err.status || 500;
  let message = err.message || 'Server error';
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 11000) {
    status = 409;
    message = err.keyPattern && err.keyPattern.email ? 'Email already registered' : 'Duplicate entry';
  }
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID';
  }
  res.status(status).json({ message });
};
