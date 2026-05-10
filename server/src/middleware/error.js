function notFound(req, res, _next) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (status >= 500) {
    console.error('[error]', err);
  }
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
