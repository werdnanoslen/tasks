import db from '../_helpers/db.js';

export default function authorize() {
  return async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await db.User.findOne({
      where: { session: token },
    });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user.get();
    next();
  };
}
