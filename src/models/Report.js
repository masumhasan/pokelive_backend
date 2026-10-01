import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reporter: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Report = mongoose.model('Report', reportSchema);
