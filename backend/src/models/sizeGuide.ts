import mongoose, { Schema } from "mongoose";

export type SizeGuideCategoryKey = "apparel" | "shoes" | "accessories";

export type SizeGuideDoc = {
  category: SizeGuideCategoryKey;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string>>;
  updatedAt: string;
};

const ColumnSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

const SizeGuideSchema = new Schema<SizeGuideDoc>(
  {
    category: { type: String, required: true, enum: ["apparel", "shoes", "accessories"], unique: true, index: true },
    columns: { type: [ColumnSchema], required: true, default: [] },
    rows: { type: [Schema.Types.Mixed] as any, required: true, default: [] },
    updatedAt: { type: String, required: true, default: "" },
  },
  { timestamps: true },
);

export const SizeGuideModel =
  (mongoose.models.SizeGuide as mongoose.Model<SizeGuideDoc> | undefined) ||
  mongoose.model<SizeGuideDoc>("SizeGuide", SizeGuideSchema);
