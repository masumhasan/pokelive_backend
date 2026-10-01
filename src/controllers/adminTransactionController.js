import * as adminTxService from '../services/adminTransactionService.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export async function getTransactions(req, res, next) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { items, total, stats } = await adminTxService.listTransactions({ page, limit, search });
    const response = { items, stats };
    return sendPaginated(res, response, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getTransactionDetails(req, res, next) {
  try {
    const tx = await adminTxService.getTransactionDetails(req.params.id);
    return sendSuccess(res, tx);
  } catch (error) {
    next(error);
  }
}

export async function getPayouts(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { items, total } = await adminTxService.listPayoutRequests({ page, limit });
    return sendPaginated(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function approvePayout(req, res, next) {
  try {
    const result = await adminTxService.approvePayout(req.params.id);
    return sendSuccess(res, result, 'Payout approved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function rejectPayout(req, res, next) {
  try {
    const result = await adminTxService.rejectPayout(req.params.id);
    return sendSuccess(res, result, 'Payout rejected.');
  } catch (error) {
    next(error);
  }
}
