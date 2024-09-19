import mongoose from "mongoose";
const { Schema } = mongoose;

const customerSchema = new Schema({
  customerID: {
    type: Schema.Types.ObjectId,
    ref: "User", // Referencing the User schema
    required: true,
  },
  ordersCount: {
    type: Number,
    default: 0,
  },
});

const shopSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User", // Referencing the User schema to associate a shop with a user
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product", // You can define a Product schema separately
    },
  ],
  customers: [customerSchema], // Embedding the customerSchema
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Shop = mongoose.model("Shop", shopSchema);
export default Shop;
