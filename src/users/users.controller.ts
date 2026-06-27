import express from 'express';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import validateRequest from '../_middleware/validate-request.js';
import authorize from '../_middleware/authorize.js';
import * as userService from './user.service.js';

const userRouter = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
});

userRouter.post('/login', loginLimiter, loginSchema, login);
userRouter.get('/login-status', getLoginStatus);
userRouter.get('/registration-status', getRegistrationStatus);
userRouter.post('/register', loginLimiter, registerSchema, register);
userRouter.get('/logout', authorize(), logout);
userRouter.get('/current', authorize(), getCurrent);
userRouter.put('/:id', authorize(), requireSelf, updateSchema, update);
userRouter.delete('/:id', authorize(), requireSelf, _delete);

export default userRouter;

function loginSchema(req, res, next) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function login(req, res, next) {
  userService
    .login(req.body)
    .then((user) => {
      res
        .cookie('token', user.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
          maxAge: 1000 * 60 * 60 * 24 * 14, // 14 Day Age,
        })
        .send({
          loggedIn: true,
          message: 'Login Successful.',
        });
    })
    .catch(next);
}

function logout(req, res, next) {
  userService
    .update(req.user.id, { session: null })
    .then(
      res
        .cookie('token', null, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
          maxAge: 0,
        })
        .json({
          loggedIn: false,
          message: 'Logout Successful.',
        })
    )
    .catch(next);
}

function getRegistrationStatus(req, res, _next) {
  res.json({ open: process.env.REGISTRATION_OPEN === 'true' });
}

function getLoginStatus(req, res, next) {
  userService
    .getBySession(req.cookies?.token)
    .then(() => {
      res.json({ isLoggedIn: true });
    })
    .catch(() => {
      res.json({ isLoggedIn: false });
    });
}

function registerSchema(req, res, next) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });
  validateRequest(req, next, schema);
}

function register(req, res, next) {
  if (process.env.REGISTRATION_OPEN !== 'true') {
    return res.status(403).json({ message: 'Registration is disabled.' });
  }
  userService
    .create(req.body)
    .then((ret) => {
      res
        .cookie('token', ret, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
          maxAge: 1000 * 60 * 60 * 24 * 14, // 14 Day Age,
        })
        .json({
          authenticated: true,
          message: 'Registration Successful.',
          data: ret,
        });
    })
    .catch(next);
}

function requireSelf(req, res, next) {
  if (req.params.id !== String(req.user.id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

function getCurrent(req, res, next) {
  res.json(req.user);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    username: Joi.string().empty(''),
    password: Joi.string().min(6).empty(''),
  });
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  userService
    .update(req.user.id, req.body)
    .then((user) => res.json(user))
    .catch(next);
}

function _delete(req, res, next) {
  userService
    .delete(req.user.id)
    .then(() => res.json({ message: 'User deleted successfully' }))
    .catch(next);
}
