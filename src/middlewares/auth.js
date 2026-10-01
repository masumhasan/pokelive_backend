import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is missing or malformed.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      throw new UnauthorizedError('User account associated with this token no longer exists.');
    }

    if (user.isBlocked) {
      throw new ForbiddenError('Your account has been blocked. Please contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource.'));
    }
    next();
  };
}

export function requireSeller(req, res, next) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }
  if (req.user.sellerStatus !== 'approved') {
    return next(
      new ForbiddenError('Approved seller status is required to perform this operation.')
    );
  }
  next();
}
