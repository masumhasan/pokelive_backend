import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { NotFoundError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

export async function getStoreDetails(req, res, next) {
  try {
    const store = await Store.findById(req.params.id).lean();
    if (!store) throw new NotFoundError('Store not found.');

    const [products, reviews] = await Promise.all([
      Product.find({ store: store._id, status: 'Active' }).sort({ createdAt: -1 }).limit(20).lean(),
      Review.find({ store: store._id }).populate('user', 'firstName lastName avatar').limit(10).lean(),
    ]);

    return sendSuccess(res, { store, products, reviews });
  } catch (error) {
    next(error);
  }
}
