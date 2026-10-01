import * as streamService from '../services/streamService.js';
import { getIO } from '../sockets/socketHandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

export async function getSelectableProducts(req, res, next) {
  try {
    const products = await streamService.getSelectableProducts(req.user._id);
    return sendSuccess(res, products);
  } catch (error) {
    next(error);
  }
}

export async function createStream(req, res, next) {
  try {
    const data = await streamService.createStream(req.user._id, req.body);
    return sendSuccess(res, data, 'Livestream created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function endStream(req, res, next) {
  try {
    const io = getIO();
    const result = await streamService.endStream(req.user._id, req.params.id, io);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function pinProduct(req, res, next) {
  try {
    const io = getIO();
    const { productId } = req.body;
    const stream = await streamService.pinProduct(req.user._id, req.params.id, productId, io);
    return sendSuccess(res, stream, 'Product pinned to stream.');
  } catch (error) {
    next(error);
  }
}

export async function getActiveStreams(req, res, next) {
  try {
    const { category, search = '', page = 1, limit = 20 } = req.query;
    const { streams, total } = await streamService.getActiveStreams({ category, search, page, limit });
    return sendPaginated(res, streams, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function joinStream(req, res, next) {
  try {
    const io = getIO();
    const data = await streamService.joinStream(req.user._id, req.params.id, io);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function leaveStream(req, res, next) {
  try {
    const io = getIO();
    const result = await streamService.leaveStream(req.user._id, req.params.id, io);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
