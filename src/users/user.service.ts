import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../_helpers/db.js';

export async function login({ username, password }) {
  const user = await db.User.scope('withHash').findOne({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.hash)))
    throw 'Username or password is incorrect';

  const token = jwt.sign({ sub: user.id }, process.env.TOKEN_SECRET, {
    expiresIn: '7d',
  });
  update(user.id, { session: token });
  return { ...omitHash(user.get()), token };
}

export async function getAll() {
  return await db.User.findAll();
}

export async function getById(id) {
  return await getUser(id);
}

export async function getBySession(token) {
  const user = await db.User.findOne({ where: { session: token } });
  if (!user) throw 'User not found';
  return user;
}

export async function create(params) {
  // validate
  if (await db.User.findOne({ where: { username: params.username } })) {
    throw `Username '${params.username}' is already taken`;
  }

  // hash password
  if (params.password) {
    params.hash = await bcrypt.hash(params.password, 10);
  }

  // save user
  return await db.User.create(params);
}

export async function update(id, params) {
  const user = await getUser(id);

  // validate
  const usernameChanged = params.username && user.username !== params.username;
  if (
    usernameChanged &&
    (await db.User.findOne({ where: { username: params.username } }))
  ) {
    throw `Username '${params.username}' is already taken`;
  }

  // hash password if it was entered
  if (params.password) {
    params.hash = await bcrypt.hash(params.password, 10);
  }

  // copy params to user and save
  Object.assign(user, params);
  await user.save();

  return omitHash(user.get());
}

async function _delete(id) {
  const user = await getUser(id);
  await user.destroy();
}
export { _delete as delete };

async function _deleteAll() {
  await db.User.destroy({ truncate: true });
}
export { _deleteAll as deleteAll };

// helper functions

async function getUser(id) {
  const user = await db.User.findByPk(id);
  if (!user) throw 'User not found';
  return user;
}

function omitHash(user) {
  const { hash, ...userWithoutHash } = user;
  return userWithoutHash;
}
