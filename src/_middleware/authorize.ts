import { expressjwt } from 'express-jwt';
import jwt from 'jsonwebtoken';
import db from '../_helpers/db.js';

export default authorize;

function authorize() {
  const secret: jwt.Secret = process.env.TOKEN_SECRET;
  return [
    // authenticate JWT token and attach decoded token to request as req.user
    expressjwt({ secret, algorithms: ['HS256'] }),

    // attach full user record to request object
    async (req, res, next) => {
      const user = await db.User.findByPk(req.user.sub);
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      req.user = user.get();
      next();
    },
  ];
}
