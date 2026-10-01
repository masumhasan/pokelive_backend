import mongoose from 'mongoose';

const raffleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: 'Footwear', trim: true },
    image: { type: String, required: true },
    ticketPrice: { type: Number, default: 1.0 },
    ticketsSold: { type: Number, default: 0 },
    maxTickets: { type: Number, default: 1000 },
    totalEntries: { type: Number, default: 0 },
    drawAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    winner: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      email: { type: String },
      avatar: { type: String },
    },
  },
  { timestamps: true }
);

export const Raffle = mongoose.model('Raffle', raffleSchema);
