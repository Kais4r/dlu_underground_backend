import { Hono } from "hono";
import Order from "../models/order.model"; // Assuming your order schema is in this path
import User from "../models/user.model";

const app = new Hono();

type Product = {
  productID: string;
  name: string;
  quantity: number;
  price: number;
};

type ShippingAddress = {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
};

type PaymentRequest = {
  customerID: string;
  orderID: string;
  paymentMethod: string; // For future extension, not needed for DLU Coin payment
};

app.post("/add", async (c) => {
  try {
    const {
      customerID,
      products,
      paymentMethod,
      shippingAddress,
      shippingMethod,
      shippingCost,
      discount,
    }: {
      customerID: string;
      products: Product[];
      paymentMethod: string;
      shippingAddress: ShippingAddress;
      shippingMethod: string;
      shippingCost: number;
      discount: number;
    } = await c.req.json();

    // Validate required fields
    if (!customerID || !products || !paymentMethod || !shippingAddress) {
      return c.json(
        { success: false, message: "Missing required fields" },
        400
      );
    }

    // Calculate totalAmount with typed parameters
    const totalAmount =
      products.reduce((total: number, product: Product) => {
        return total + product.price * product.quantity;
      }, 0) +
      shippingCost -
      discount;

    const order = new Order({
      customerID,
      products,
      totalAmount,
      paymentMethod,
      shippingAddress,
      shippingMethod,
      shippingCost,
      discount,
    });

    // Save order to database
    await order.save();

    return c.json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(error);

    // Type guard or casting error to Error
    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          message: "Failed to create order",
          error: error.message,
        },
        500
      );
    }

    // Handle unknown error types
    return c.json(
      { success: false, message: "An unknown error occurred" },
      500
    );
  }
});

app.post("/pay", async (c) => {
  try {
    const { customerID, orderID }: PaymentRequest = await c.req.json();
    console.log(orderID);

    // Validate required fields
    if (!customerID || !orderID) {
      return c.json(
        { success: false, message: "Missing required fields" },
        400
      );
    }

    // Find the order
    const order = await Order.findById(orderID);
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    // Find the user
    const user = await User.findById(customerID);
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    // Check if the user has enough DLU Coin
    if (user.dluCoin < order.totalAmount) {
      return c.json(
        { success: false, message: "Insufficient DLU Coin balance" },
        400
      );
    }

    // Subtract DLU Coin
    user.dluCoin -= order.totalAmount;
    await user.save();

    // Update the order's payment status
    order.paymentStatus = "paid";
    await order.save();

    return c.json({
      success: true,
      message: "Payment successful and order updated",
      order,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          message: "Failed to process payment",
          error: error.message,
        },
        500
      );
    }

    return c.json(
      { success: false, message: "An unknown error occurred" },
      500
    );
  }
});

export default app;
