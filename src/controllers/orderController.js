import * as orderService from '../services/orderService.js';
import { sendSuccess } from '../utils/response.js';

export async function getSummary(req, res, next) {
  try {
    const { subtotal, shippingPartner } = req.body;
    const summary = await orderService.calculateSummary({ subtotal: Number(subtotal), shippingPartner });
    return sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  try {
    const orders = await orderService.createOrder(req.user._id, req.body);
    return sendSuccess(res, orders, 'Order placed successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getActiveOrders(req, res, next) {
  try {
    const orders = await orderService.getActiveOrders(req.user._id);
    return sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
}

export async function getOrderHistory(req, res, next) {
  try {
    const orders = await orderService.getOrderHistory(req.user._id);
    return sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
}

// Seller orders
export async function getSellerOrders(req, res, next) {
  try {
    const tab = parseInt(req.query.tab || '0', 10);
    const orders = await orderService.getSellerOrders(req.user._id, tab);
    return sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const order = await orderService.updateSellerOrderStatus(req.user._id, req.params.id, req.body.status);
    return sendSuccess(res, order, 'Order status updated.');
  } catch (error) {
    next(error);
  }
}
