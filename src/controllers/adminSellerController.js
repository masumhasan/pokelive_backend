import * as adminSellerService from '../services/adminSellerService.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export async function getApprovals(req, res, next) {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const { approvals, total } = await adminSellerService.listSellerApprovals({ search, page, limit });
    return sendPaginated(res, approvals, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function approveApplication(req, res, next) {
  try {
    const result = await adminSellerService.approveSellerApplication(req.params.id, req.user._id);
    return sendSuccess(res, result, 'Seller approved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function rejectApplication(req, res, next) {
  try {
    const { reason } = req.body;
    const result = await adminSellerService.rejectSellerApplication(req.params.id, req.user._id, reason);
    return sendSuccess(res, result, 'Seller application rejected.');
  } catch (error) {
    next(error);
  }
}

export async function getSellers(req, res, next) {
  try {
    const { page = 1, limit = 10, search, isBlocked } = req.query;
    const { sellers, total } = await adminSellerService.listSellers({ search, page, limit, isBlocked });
    return sendPaginated(res, sellers, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function toggleBlockSeller(req, res, next) {
  try {
    const result = await adminSellerService.toggleBlockSeller(req.params.id);
    return sendSuccess(res, result, 'Seller store block status updated.');
  } catch (error) {
    next(error);
  }
}

export async function deleteSeller(req, res, next) {
  try {
    const result = await adminSellerService.deleteSeller(req.params.id);
    return sendSuccess(res, result, 'Seller deleted successfully.');
  } catch (error) {
    next(error);
  }
}

