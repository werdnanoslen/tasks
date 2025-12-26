export default function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = err.message;
  
  if (typeof err === 'string') {
    statusCode = err.toLowerCase().endsWith('not found') ? 404 : 400;
    message = err;
  } else if (
    err.name === 'UnauthorizedError' ||
    err.name.includes('TokenExpiredError') ||
    err.message.includes('jwt must be provided')
  ) {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
  }
  
  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }
  
  // Log errors for debugging (but don't send to client)
  if (statusCode === 500) {
    console.error('Server error:', err);
  }
  
  return res.status(statusCode).json({ message: message });
}
