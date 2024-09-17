import mongoose from "mongoose";
const { Schema } = mongoose;

const orderSchema = new Schema({
  customerID: { type: String, required: true }, // Reference to the customer
  products: [
    {
      productID: { type: String, required: true }, // Reference to the Product schema
      name: { type: String, required: true }, // Store product name for convenience
      quantity: { type: Number, required: true, default: 1 },
      price: { type: Number, required: true }, // Store the price at the time of purchase
    },
  ],
  totalAmount: { type: Number, required: true }, // Total cost of the order
  orderStatus: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "canceled"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid",
  },
  paymentMethod: {
    type: String,
    enum: [
      "credit card",
      "paypal",
      "cash on delivery",
      "bank transfer",
      "dluCoin",
    ],
    required: true,
    default: "credit card",
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  shippingMethod: {
    type: String,
    required: true,
    default: "Standard shipping",
  },
  shippingCost: { type: Number, default: 0 },
  discount: { type: Number, default: 0 }, // Applied discount on the order
  dateOrdered: { type: Date, default: Date.now }, // When the order was placed
  dateShipped: { type: Date }, // When the order was shipped
  trackingNumber: { type: String }, // Shipping tracking number
  dateDelivered: { type: Date }, // When the order was delivered
  notes: { type: String }, // Additional order notes
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
