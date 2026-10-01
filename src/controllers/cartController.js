import * as cartService from '../services/cartService.js';
import { sendSuccess } from '../utils/response.js';

export async function getCart(req, res, next) {
  try {
    const cart = await cartService.getCart(req.user._id);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
}

export async function addItem(req, res, next) {
  try {
    const cart = await cartService.addToCart(req.user._id, req.body);
    return sendSuccess(res, cart, 'Item added to cart.');
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req, res, next) {
  try {
    const cart = await cartService.updateCartItem(req.user._id, req.params.id, req.body.quantity);
    return sendSuccess(res, cart, 'Cart updated.');
  } catch (error) {
    next(error);
  }
}

export async function removeItem(req, res, next) {
  try {
    const cart = await cartService.removeFromCart(req.user._id, req.params.id);
    return sendSuccess(res, cart, 'Item removed from cart.');
  } catch (error) {
    next(error);
  }
}
