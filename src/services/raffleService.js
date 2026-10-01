import { Raffle } from '../models/Raffle.js';
import { RaffleTicket } from '../models/RaffleTicket.js';
import { PastWinner } from '../models/PastWinner.js';
import { User } from '../models/User.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export async function getActiveRaffle() {
  let raffle = await Raffle.findOne({ isActive: true }).lean();
  if (!raffle) {
    // Seed initial raffle if none active
    raffle = await Raffle.create({
      title: 'Win Nike Special sneaker',
      description:
        'Join our weekly community raffle! For just £1, you could own one of the rarest cards in existence. 100% of proceeds fund community events and expansion of the PokéLive ecosystem.',
      category: 'Footwear',
      image:
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1200&auto=format&fit=crop',
      ticketsSold: 800,
      maxTickets: 1000,
      totalEntries: 12450,
      drawAt: new Date(Date.now() + (65 * 60 + 24) * 1000),
      isActive: true,
      winner: {
        name: 'Nm Sujon',
        email: 'sujon@gmail.com',
        avatar: 'https://ui-avatars.com/api/?name=Nm+Sujon&background=333333&color=fff&size=64',
      },
    });
  }
  return raffle;
}

export async function enterRaffle(userId, { ticketCount = 1 }) {
  const count = Math.max(1, Number(ticketCount));
  const raffle = await Raffle.findOne({ isActive: true });
  if (!raffle) throw new NotFoundError('No active raffle currently running.');

  if (raffle.ticketsSold + count > raffle.maxTickets) {
    throw new BadRequestError(`Only ${raffle.maxTickets - raffle.ticketsSold} tickets remain.`);
  }

  const user = await User.findById(userId).lean();
  if (!user) throw new NotFoundError('User not found.');

  await RaffleTicket.create({
    raffle: raffle._id,
    user: userId,
    userName: `${user.firstName} ${user.lastName}`.trim(),
    ticketCount: count,
  });

  raffle.ticketsSold += count;
  raffle.totalEntries += count;
  await raffle.save();

  return { message: `Successfully purchased ${count} tickets!`, ticketsSold: raffle.ticketsSold };
}

export async function getPastWinners() {
  let winners = await PastWinner.find().sort({ createdAt: -1 }).lean();
  if (winners.length === 0) {
    // Seed initial past winners matching dashboard/app data
    winners = await PastWinner.insertMany([
      { name: 'Sujon', prize: 'Nike Sneaker Special', drawnDate: '02 Oct, 2026', status: 'Delivered' },
      { name: 'Farzana Yesmin', prize: 'PokéLive Founders Card', drawnDate: '25 Sep, 2026', status: 'Delivered' },
      { name: 'Rahim Khan', prize: 'Limited Edition Hoodie', drawnDate: '18 Sep, 2026', status: 'Shipped' },
      { name: 'Tania Rahman', prize: 'Nike Sneaker Special', drawnDate: '11 Sep, 2026', status: 'Delivered' },
      { name: 'Al Amin', prize: 'Signed Booster Box', drawnDate: '04 Sep, 2026', status: 'Pending' },
    ]);
  }
  return winners;
}

// ─── Admin Operations ───────────────────────────────────────────────────────
export async function createOrUpdateCurrentRaffle(data) {
  let raffle = await Raffle.findOne({ isActive: true });
  if (!raffle) {
    raffle = await Raffle.create({ ...data, isActive: true });
  } else {
    Object.assign(raffle, data);
    await raffle.save();
  }
  return raffle;
}

export async function drawWinner(raffleId) {
  const raffle = await Raffle.findById(raffleId);
  if (!raffle) throw new NotFoundError('Raffle not found.');

  const tickets = await RaffleTicket.find({ raffle: raffle._id }).populate('user');
  let winnerUser = null;

  if (tickets.length > 0) {
    const randomIndex = Math.floor(Math.random() * tickets.length);
    winnerUser = tickets[randomIndex].user;
  } else {
    // ponytail: fallback to any active user if no tickets bought in dev
    winnerUser = await User.findOne({ role: 'User' }).lean();
  }

  const winnerData = {
    user: winnerUser?._id,
    name: winnerUser ? `${winnerUser.firstName} ${winnerUser.lastName}`.trim() : 'Community Winner',
    email: winnerUser?.email || 'winner@pokelive.com',
    avatar: winnerUser?.avatar || 'https://ui-avatars.com/api/?name=Winner&background=333333&color=fff',
  };

  raffle.winner = winnerData;
  await raffle.save();

  const pastWinner = await PastWinner.create({
    raffle: raffle._id,
    user: winnerUser?._id,
    name: winnerData.name,
    prize: raffle.title,
    drawnDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: 'Pending',
  });

  return { winner: winnerData, pastWinner };
}

export async function updateWinnerStatus(winnerId, status) {
  const winner = await PastWinner.findByIdAndUpdate(winnerId, { $set: { status } }, { new: true }).lean();
  if (!winner) throw new NotFoundError('Winner record not found.');
  return winner;
}
