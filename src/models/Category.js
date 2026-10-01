import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    image: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);
