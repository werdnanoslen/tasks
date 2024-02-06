import db from '../_helpers/db.js';

export default function authorize() {
  return async (req, res, next) => {
    const user = await db.User.findOne({
      where: { session: req.cookies?.token },
    });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user.get();
    next();
  };
}
