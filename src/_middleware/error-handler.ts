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
  }
  return res.status(statusCode).json({ message: message });
}
