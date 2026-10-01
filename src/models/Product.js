import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    packageWeight: { type: String, default: '' },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['Active', 'Stock Out', 'Archived'],
      default: 'Active',
      index: true,
    },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 },
    isFeaturedInStream: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save to auto-sync status based on quantity
productSchema.pre('save', function () {
  if (this.quantity <= 0 && this.status === 'Active') {
    this.status = 'Stock Out';
  } else if (this.quantity > 0 && this.status === 'Stock Out') {
    this.status = 'Active';
  }
});

export const Product = mongoose.model('Product', productSchema);
