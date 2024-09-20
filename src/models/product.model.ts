import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema({
  name: { type: String, required: true },
  totalSale: { type: Number, default: 0 },
  totalSaleValue: { type: Number, default: 0 },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  shippingCost: { type: Number, required: true },
  category: { type: String, required: true, default: "Miscellaneous" },
  brand: { type: String, required: true, default: "Generic" },
  sku: { type: String, required: true },
  stockQuantity: { type: Number, required: true, default: 0 },
  images: { type: [String], required: true, default: [] },
  thumbnailImage: {
    type: String,
    required: true,
    default: "default-thumbnail.jpg",
  },
  weight: { type: Number, default: 0 },
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  color: { type: [String], default: [] },
  size: { type: [String], default: [] },
  material: { type: String, default: "Not specified" },
  rating: { type: Number, default: 0 },
  reviews: { type: [String], default: [] },
  dateAdded: { type: Date, default: Date.now },
  dateModified: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["in stock", "out of stock", "discontinued"],
    required: true,
    default: "in stock",
  },
  discount: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  supplierID: { type: String, default: "Unknown" },
  warranty: { type: String, default: "No warranty" },
  shippingDetails: { type: String, default: "Standard shipping" },
});

const Product = mongoose.model("Product", productSchema);
export default Product;
