import * as orderService from '../services/orderService.js';
import * as shippingLabelService from '../services/shippingLabelService.js';
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

export async function createPaymentIntent(req, res, next) {
  try {
    const intent = await orderService.createPaymentIntent(req.user._id, req.body);
    return sendSuccess(res, intent, 'Payment intent created successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getStripeConfig(req, res, next) {
  try {
    const config = orderService.getStripeConfig();
    return sendSuccess(res, config);
  } catch (error) {
    next(error);
  }
}

export async function getShippingLabel(req, res, next) {
  try {
    const label = await shippingLabelService.getShippingLabel(req.user._id, req.params.id);
    return sendSuccess(res, label, 'Shipping label generated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function downloadShippingLabelPdf(req, res, next) {
  try {
    const label = await shippingLabelService.getShippingLabel(req.user._id, req.params.id);
    const pdfBuf = shippingLabelService.generatePdf(label);
    const filename = `shipping-label-${label.orderId.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuf);
  } catch (error) {
    next(error);
  }
}

export async function downloadShippingLabelPng(req, res, next) {
  try {
    const label = await shippingLabelService.getShippingLabel(req.user._id, req.params.id);
    const pngBuf = shippingLabelService.generatePng(label);
    const filename = `shipping-label-${label.orderId.replace(/[^a-zA-Z0-9]/g, '')}.png`;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(pngBuf);
  } catch (error) {
    next(error);
  }
}


