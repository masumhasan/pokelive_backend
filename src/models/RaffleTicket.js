import mongoose from 'mongoose';

const raffleTicketSchema = new mongoose.Schema(
  {
    raffle: { type: mongoose.Schema.Types.ObjectId, ref: 'Raffle', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    ticketCount: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: true }
);

export const RaffleTicket = mongoose.model('RaffleTicket', raffleTicketSchema);
