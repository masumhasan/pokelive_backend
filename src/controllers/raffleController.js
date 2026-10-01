import * as raffleService from '../services/raffleService.js';
import { sendSuccess } from '../utils/response.js';

export async function getActive(req, res, next) {
  try {
    const raffle = await raffleService.getActiveRaffle();
    return sendSuccess(res, raffle);
  } catch (error) {
    next(error);
  }
}

export async function enter(req, res, next) {
  try {
    const result = await raffleService.enterRaffle(req.user._id, req.body);
    return sendSuccess(res, result, 'Raffle entry confirmed.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getPastWinners(req, res, next) {
  try {
    const winners = await raffleService.getPastWinners();
    return sendSuccess(res, winners);
  } catch (error) {
    next(error);
  }
}

// ─── Admin Controller Actions ───────────────────────────────────────────────
export async function adminUpdateCurrent(req, res, next) {
  try {
    const raffle = await raffleService.createOrUpdateCurrentRaffle(req.body);
    return sendSuccess(res, raffle, 'Current raffle updated.');
  } catch (error) {
    next(error);
  }
}

export async function adminDrawWinner(req, res, next) {
  try {
    const result = await raffleService.drawWinner(req.params.id);
    return sendSuccess(res, result, 'Winner drawn successfully.');
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateWinnerStatus(req, res, next) {
  try {
    const { status } = req.body;
    const winner = await raffleService.updateWinnerStatus(req.params.id, status);
    return sendSuccess(res, winner, 'Winner prize delivery status updated.');
  } catch (error) {
    next(error);
  }
}
