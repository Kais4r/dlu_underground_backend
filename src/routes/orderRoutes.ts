import { Hono } from "hono";
import Order from "../models/order.model"; // Assuming your order schema is in this path
import User from "../models/user.model";
import Shop from "../models/shop.model";
import Product from "../models/product.model"; // Update the path as necessary
import mongoose from "mongoose";

const app = new Hono();

type Product = {
  productID: string;
  name: string;
  brand: string;
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
      customerName,
      products,
      paymentMethod,
      shippingAddress,
      shippingMethod,
      shippingCost,
      discount,
    }: {
      customerID: string;
      customerName: string;
      products: {
        productID: string;
        name: string;
        brand: string;
        quantity: number;
        price: number;
      }[];
      paymentMethod: string;
      shippingAddress: {
        fullName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phoneNumber: string;
      };
      shippingMethod: string;
      shippingCost: number;
      discount: number;
    } = await c.req.json();

    // Validate required fields
    if (
      !customerID ||
      !customerName ||
      !products ||
      !paymentMethod ||
      !shippingAddress
    ) {
      return c.json(
        { success: false, message: "Missing required fields" },
        400
      );
    }

    // Convert customerID to ObjectId
    const customerObjectId = new mongoose.Types.ObjectId(customerID);

    // Check if the customer has bought products from the shop before
    const productNamesAndBrands = products.map((p) => ({
      name: p.name,
      brand: p.brand,
    }));

    const shops = await Shop.find({});

    for (const shop of shops) {
      const hasBoughtFromShop = await Order.findOne({
        customerID: customerObjectId,
        products: {
          $elemMatch: {
            $or: productNamesAndBrands.map((p) => ({
              name: p.name,
              brand: p.brand,
            })),
          },
        },
      });

      if (!hasBoughtFromShop) {
        // Add or update customer in the shop's customer list
        const existingCustomer = shop.customers.find(
          (customer) => customer.customerID.toString() === customerID
        );

        if (!existingCustomer) {
          // Add new customer with ordersCount = 1 and set name
          shop.customers.push({
            customerID: customerObjectId,
            name: customerName,
            ordersCount: 1,
          });
        } else {
          // Increment ordersCount for existing customer
          existingCustomer.ordersCount += 1;
        }
      } else {
        // Increment ordersCount for existing customer
        const existingCustomer = shop.customers.find(
          (customer) => customer.customerID.toString() === customerID
        );

        if (existingCustomer) {
          existingCustomer.ordersCount += 1;
        }
      }

      // Save the updated shop document
      await shop.save();
    }

    // Get platform discounts
    const platformDiscounts = await Promise.all(
      shops.map(async (shop) => ({
        discount: shop.platformDiscount,
        shippingDiscount: shop.platformShippingDiscount,
      }))
    );

    // Calculate totalAmount
    const baseTotalAmount =
      products.reduce(
        (total: number, product: { quantity: number; price: number }) =>
          total + product.price * product.quantity,
        0
      ) + shippingCost;

    const totalDiscount = platformDiscounts.reduce(
      (acc, { discount, shippingDiscount }) =>
        acc + discount + shippingDiscount,
      discount
    );

    const totalAmount = baseTotalAmount - totalDiscount;

    // Create and save the order
    const order = new Order({
      customerID: customerObjectId,
      products,
      totalAmount,
      paymentMethod,
      shippingAddress,
      shippingMethod,
      shippingCost,
      discount: totalDiscount,
    });
    await order.save();

    // Update product sales
    await Promise.all(
      products.map(async (item) => {
        const { productID, quantity, price } = item;

        await Product.findByIdAndUpdate(
          productID,
          {
            $inc: {
              totalSale: quantity,
              totalSaleValue: price * quantity,
            },
            $set: { dateModified: new Date() },
          },
          { new: true }
        );
      })
    );

    return c.json({
      success: true,
      message:
        "Order created, products updated, and customer list updated successfully",
      order,
    });
  } catch (error) {
    console.error(error);

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

    return c.json(
      { success: false, message: "An unknown error occurred" },
      500
    );
  }
});

app.post("/pay", async (c) => {
  try {
    const { customerID, orderID }: PaymentRequest = await c.req.json();

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

app.get("/getByShopOrderStatus", async (c) => {
  // Extract query parameters
  const { shopName, orderStatus } = c.req.query as {
    shopName?: string;
    orderStatus?: string;
  };

  // Build the query
  const query: any = {};

  if (shopName) {
    query["products.brand"] = shopName; // Check the brand in the products array
  }

  if (orderStatus) {
    query.orderStatus = orderStatus; // Check the order status
  }

  try {
    // Fetch orders based on the query
    const orders = await Order.find(query);

    // Return the orders
    return c.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

app.get("/by-brand", async (c) => {
  const { brand } = c.req.query();

  if (!brand) {
    return c.json({ error: "Brand query parameter is required" }, 400);
  }

  try {
    const orders = await Order.find({ "products.brand": brand }).exec();
    return c.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/by-customer-id", async (c) => {
  const { customerID } = c.req.query();

  // Check if customerID is provided
  if (!customerID) {
    return c.json({ error: "customerID query parameter is required" }, 400);
  }

  try {
    // Fetch orders where the customerID matches the provided value
    const orders = await Order.find({ customerID: customerID }).exec();

    // Return the fetched orders
    return c.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default app;
