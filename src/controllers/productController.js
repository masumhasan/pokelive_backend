import * as productService from '../services/productService.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export async function create(req, res, next) {
  try {
    const product = await productService.createProduct(req.user._id, req.body);
    return sendSuccess(res, product, 'Product created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getSellerInventory(req, res, next) {
  try {
    const { filter = 'All', search = '', page = 1, limit = 20 } = req.query;
    const { products, total } = await productService.getSellerProducts(req.user._id, {
      filter,
      search,
      page,
      limit,
    });
    return sendPaginated(res, products, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const updated = await productService.updateProduct(req.user._id, req.params.id, req.body);
    return sendSuccess(res, updated, 'Product updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await productService.deleteProduct(req.user._id, req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getDetails(req, res, next) {
  try {
    const product = await productService.getProductDetails(req.params.id);
    return sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
}

export async function listAll(req, res, next) {
  try {
    const { search = '', category, storeId, page = 1, limit = 20 } = req.query;
    const { products, total } = await productService.listProducts({
      search,
      category,
      storeId,
      page,
      limit,
    });
    return sendPaginated(res, products, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getReviews(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { reviews, total } = await productService.getProductReviews(req.params.id, { page, limit });
    return sendPaginated(res, reviews, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function addReview(req, res, next) {
  try {
    const review = await productService.createProductReview(req.user._id, req.params.id, req.body);
    return sendSuccess(res, review, 'Review added successfully.', 201);
  } catch (error) {
    next(error);
  }
}
