import mongoose from 'mongoose';

const pastWinnerSchema = new mongoose.Schema(
  {
    raffle: { type: mongoose.Schema.Types.ObjectId, ref: 'Raffle' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    prize: { type: String, required: true },
    drawnDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['Delivered', 'Shipped', 'Pending'],
      default: 'Pending',
      index: true,
    },
  },
  { timestamps: true }
);

export const PastWinner = mongoose.model('PastWinner', pastWinnerSchema);
