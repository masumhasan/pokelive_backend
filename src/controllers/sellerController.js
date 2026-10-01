import * as sellerService from '../services/sellerService.js';
import { sendSuccess } from '../utils/response.js';

export async function apply(req, res, next) {
  try {
    const application = await sellerService.applyToBecomeSeller(req.user._id, req.body);
    return sendSuccess(res, application, 'Seller application submitted successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getApplicationStatus(req, res, next) {
  try {
    const status = await sellerService.getApplicationStatus(req.user._id);
    return sendSuccess(res, status);
  } catch (error) {
    next(error);
  }
}

export async function getHubSummary(req, res, next) {
  try {
    const summary = await sellerService.getSellerHubSummary(req.user._id);
    return sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
}

export async function getStorefront(req, res, next) {
  try {
    const storefront = await sellerService.getStorefront(req.user._id);
    return sendSuccess(res, storefront);
  } catch (error) {
    next(error);
  }
}

export async function updateStorefront(req, res, next) {
  try {
    const updated = await sellerService.updateStorefront(req.user._id, req.body);
    return sendSuccess(res, updated, 'Storefront updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getSenderAddress(req, res, next) {
  try {
    const address = await sellerService.getSenderAddress(req.user._id);
    return sendSuccess(res, address);
  } catch (error) {
    next(error);
  }
}

export async function updateSenderAddress(req, res, next) {
  try {
    const address = await sellerService.updateSenderAddress(req.user._id, req.body);
    return sendSuccess(res, address, 'Sender address saved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getPayouts(req, res, next) {
  try {
    const data = await sellerService.getSellerPayouts(req.user._id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function requestPayout(req, res, next) {
  try {
    const payout = await sellerService.requestPayout(req.user._id, req.body);
    return sendSuccess(res, payout, 'Payout requested successfully.', 201);
  } catch (error) {
    next(error);
  }
}
