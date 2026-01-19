const mongoose = require('mongoose');

const ColumnSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

const SizeGuideSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    columns: { type: [ColumnSchema], required: true, default: [] },
    rows: { type: [mongoose.Schema.Types.Mixed], required: true, default: [] },
    updatedAt: { type: String, required: true, default: '' },
  },
  { timestamps: true },
);

const SizeGuideModel =
  mongoose.models.SizeGuide || mongoose.model('SizeGuide', SizeGuideSchema);

module.exports = { SizeGuideModel };
