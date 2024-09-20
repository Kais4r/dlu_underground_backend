import { Hono } from "hono";
import Cart from "../models/buyerCart.model"; // Path to your Cart model
import Product from "../models/product.model";

const app = new Hono();

app.post("/add", async (c) => {
  try {
    const { userID, productID, quantity } = await c.req.json();

    if (!userID || !productID || !quantity) {
      return c.json(
        { success: false, message: "Missing required fields" },
        400
      );
    }

    // Find the cart for the user
    let cart = await Cart.findOne({ userID }).exec();

    // Find the product to get price and name
    const product = await Product.findById(productID).exec();
    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }

    // Calculate price with discount if applicable
    const price =
      product.discount && product.discount > 0
        ? product.price - product.price * (product.discount / 100)
        : product.price;

    console.log(product.brand);
    const cartItem = {
      productID,
      name: product.name,
      brand: product.brand,
      price,
      quantity,
      totalPrice: price * quantity,
      thumbnailImage: product.thumbnailImage,
    };

    if (cart) {
      // If cart exists, check if the item is already in the cart
      const existingItem = cart.items.find(
        (item) => item.productID.toString() === productID
      );
      if (existingItem) {
        // Update the existing item's quantity and totalPrice
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.price * existingItem.quantity;
      } else {
        // Add new item to cart
        cart.items.push(cartItem);
      }

      // Calculate the new cart total
      cart.cartTotal = cart.items.reduce(
        (total, item) => total + item.totalPrice,
        0
      );

      // Save the updated cart
      await cart.save();
    } else {
      // Create a new cart if none exists for the user
      cart = new Cart({
        userID,
        items: [cartItem],
        cartTotal: cartItem.totalPrice,
      });
      await cart.save();
    }

    return c.json({
      success: true,
      message: "Item added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error(error);

    // Type guard to check if the error is an instance of Error
    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          message: "Failed to add item to cart",
          error: error.message,
        },
        500
      );
    } else {
      // Handle unexpected error types
      return c.json(
        {
          success: false,
          message: "An unexpected error occurred",
          error: "Unknown error",
        },
        500
      );
    }
  }
});

app.get("/items", async (c) => {
  try {
    const { userID } = c.req.query();

    if (!userID) {
      return c.json({ success: false, message: "User ID is required" }, 400);
    }

    // Find the cart for the user
    const cart = await Cart.findOne({ userID }).exec();

    if (!cart) {
      return c.json({ success: false, message: "Cart not found" }, 404);
    }

    return c.json({
      success: true,
      cart: cart,
    });
  } catch (error) {
    console.error(error);

    // Type guard to check if the error is an instance of Error
    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          message: "Failed to retrieve cart items",
          error: error.message,
        },
        500
      );
    } else {
      // Handle unexpected error types
      return c.json(
        {
          success: false,
          message: "An unexpected error occurred",
          error: "Unknown error",
        },
        500
      );
    }
  }
});

app.get("/items/count", async (c) => {
  try {
    const { userID } = c.req.query();

    if (!userID) {
      return c.json({ success: false, message: "User ID is required" }, 400);
    }

    // Find the cart for the user
    const cart = await Cart.findOne({ userID }).exec();

    if (!cart) {
      return c.json({ success: false, message: "Cart not found" }, 404);
    }

    // Calculate the count of items in the cart
    const itemCount = cart.items.length;

    return c.json({
      success: true,
      itemCount: itemCount,
    });
  } catch (error) {
    console.error(error);

    // Type guard to check if the error is an instance of Error
    if (error instanceof Error) {
      return c.json(
        {
          success: false,
          message: "Failed to retrieve cart item count",
          error: error.message,
        },
        500
      );
    } else {
      // Handle unexpected error types
      return c.json(
        {
          success: false,
          message: "An unexpected error occurred",
          error: "Unknown error",
        },
        500
      );
    }
  }
});

export default app;
