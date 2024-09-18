import mongoose from "mongoose";
const { Schema } = mongoose;

interface CartItem {
  productID: mongoose.Types.ObjectId;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  totalPrice: number;
  thumbnailImage?: string;
}

const cartItemSchema = new Schema<CartItem>(
  {
    productID: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    totalPrice: { type: Number, required: true }, // quantity * price
    thumbnailImage: { type: String }, // Optional: thumbnail image of the product
  },
  { _id: false }
);

interface Cart {
  userID: mongoose.Types.ObjectId;
  items: CartItem[];
  cartTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<Cart>({
  userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema],
  cartTotal: { type: Number, required: true, default: 0 }, // Total price of all items in the cart
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to calculate total price
cartSchema.pre<Cart>("save", function (next) {
  const cart = this as Cart;
  cart.cartTotal = cart.items.reduce(
    (acc: number, item: CartItem) => acc + item.totalPrice,
    0
  );
  next();
});

const Cart = mongoose.model<Cart>("Cart", cartSchema);
export default Cart;
