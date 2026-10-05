import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';

export async function createProduct(userId, data) {
  let store = await Store.findOne({ user: userId });
  if (!store) {
    const user = await User.findById(userId);
    store = await Store.create({
      user: userId,
      storeName: user?.firstName ? `${user.firstName}'s Store` : 'My Store',
      sellerName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Seller',
      avatar: user?.avatar || '',
    });
  }

  const product = await Product.create({
    seller: userId,
    store: store._id,
    title: data.title || data.name,
    description: data.description || '',
    category: data.category || 'General',
    price: Number(data.price),
    quantity: Number(data.quantity ?? 1),
    packageWeight: data.packageWeight || '',
    images: data.images || [],
    status: Number(data.quantity) > 0 ? 'Active' : 'Stock Out',
  });

  await Store.findByIdAndUpdate(store._id, { $inc: { activeProducts: 1 } });
  return product;
}

export async function getSellerProducts(userId, { filter = 'All', search = '', page = 1, limit = 100 }) {
  const query = { seller: userId, status: { $ne: 'Archived' } };
  if (filter === 'Active') query.status = 'Active';
  if (filter === 'Stock Out') query.status = 'Stock Out';
  if (search) query.title = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Product.countDocuments(query),
  ]);

  return { products, total };
}

export async function updateProduct(userId, productId, updates) {
  const product = await Product.findOne({ _id: productId, seller: userId });
  if (!product) throw new NotFoundError('Product not found or unauthorized.');

  const allowed = ['title', 'description', 'category', 'price', 'quantity', 'packageWeight', 'images', 'status'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key === 'price') product.price = Number(updates.price);
      else if (key === 'quantity') product.quantity = Number(updates.quantity);
      else product[key] = updates[key];
    }
  }

  await product.save();
  return product;
}

export async function deleteProduct(userId, productId) {
  const product = await Product.findOneAndUpdate(
    { _id: productId, seller: userId },
    { $set: { status: 'Archived' } },
    { new: true }
  );
  if (!product) throw new NotFoundError('Product not found or unauthorized.');

  await Store.findByIdAndUpdate(product.store, { $inc: { activeProducts: -1 } });
  return { message: 'Product archived successfully.' };
}

// ─── Public Queries ─────────────────────────────────────────────────────────
export async function getProductDetails(productId) {
  const product = await Product.findOne({ _id: productId, status: { $ne: 'Archived' } })
    .populate('store', 'storeName sellerName avatar rating reviewsCount liveStatus')
    .lean();
  if (!product) throw new NotFoundError('Product not found.');
  return product;
}

export async function listProducts({ search = '', category, storeId, page = 1, limit = 20 }) {
  const query = { status: 'Active' };
  if (category) query.category = category;
  if (storeId) query.store = storeId;
  if (search) query.title = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query).populate('store', 'storeName avatar').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Product.countDocuments(query),
  ]);

  return { products, total };
}

// ─── Reviews ────────────────────────────────────────────────────────────────
export async function getProductReviews(productId, { page = 1, limit = 20 }) {
  const skip = (Number(page) - 1) * Number(limit);
  const [reviews, total] = await Promise.all([
    Review.find({ product: productId })
      .populate('user', 'firstName lastName avatar name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments({ product: productId }),
  ]);

  return { reviews, total };
}

export async function createProductReview(userId, productId, { rating, comment }) {
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw new BadRequestError('Rating must be between 1 and 5.');
  }

  const product = await Product.findById(productId);
  if (!product) throw new NotFoundError('Product not found.');

  const review = await Review.create({
    user: userId,
    product: productId,
    store: product.store,
    rating: numRating,
    comment,
  });

  // Recalculate average rating for product
  const stats = await Review.aggregate([
    { $match: { product: product._id } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    product.rating = Number(stats[0].avgRating.toFixed(1));
    product.reviewsCount = stats[0].count;
    await product.save();

    await Store.findByIdAndUpdate(product.store, {
      rating: Number(stats[0].avgRating.toFixed(1)),
      $inc: { reviewsCount: 1 },
    });
  }

  return review;
}
