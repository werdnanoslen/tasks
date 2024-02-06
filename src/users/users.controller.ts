import express from 'express';
import Joi from 'joi';
import validateRequest from '../_middleware/validate-request.js';
import authorize from '../_middleware/authorize.js';
import * as userService from './user.service.js';

const router = express.Router();

// routes
router.post('/login', loginSchema, login);
router.get('/login-status', getLoginStatus);
router.post('/register', registerSchema, register);
router.get('/logout', authorize(), logout);
router.get('/', authorize(), getAll);
router.get('/current', authorize(), getCurrent);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

export default router;

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
          maxAge: 1000 * 60 * 60 * 24 * 14, // 14 Day Age,
        })
        .json({
          loggedIn: false,
          message: 'Logout Successful.',
        })
    )
    .catch(next);
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
  userService
    .create(req.body)
    .then((ret) => {
      res
        .cookie('token', ret, {
          httpOnly: true,
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

function getAll(req, res, next) {
  userService
    .getAll()
    .then((users) => res.json(users))
    .catch(next);
}

function getCurrent(req, res, next) {
  res.json(req.user);
}

function getById(req, res, next) {
  userService
    .getById(req.params.id)
    .then((user) => res.json(user))
    .catch(next);
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
    .update(req.params.id, req.body)
    .then((user) => res.json(user))
    .catch(next);
}

function _delete(req, res, next) {
  userService
    .delete(req.params.id)
    .then(() => res.json({ message: 'User deleted successfully' }))
    .catch(next);
}
