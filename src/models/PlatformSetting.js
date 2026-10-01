import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

export const PlatformSetting = mongoose.model('PlatformSetting', platformSettingSchema);
