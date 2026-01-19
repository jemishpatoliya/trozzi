import mongoose, { Schema } from "mongoose";

export type CategoryDoc = {
  name: string;
  shortDescription: string;
  description: string;
  parentId: string | null;
  order: number;
  active: boolean;
  productCount: number;
  imageUrl?: string;
};

const CategorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    parentId: { type: String, default: null },
    order: { type: Number, required: true, default: 0 },
    active: { type: Boolean, required: true, default: true },
    productCount: { type: Number, required: true, default: 0 },
    imageUrl: { type: String, required: false, default: "" },
  },
  { timestamps: true },
);

export const CategoryModel =
  (mongoose.models.Category as mongoose.Model<CategoryDoc> | undefined) ||
  mongoose.model<CategoryDoc>("Category", CategorySchema);
