import { Hono } from "hono";
import Shop from "../models/shop.model";
import User from "../models/user.model";
import Product from "../models/product.model";

const app = new Hono();

app.get("/check-shop", async (c) => {
  try {
    const userId = c.req.query("userId"); // You could get userId from session or request params

    // Check if the user exists
    const user = await User.findById(userId);
    //console.log("user");
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if the user already has a shop
    const shop = await Shop.findOne({ owner: userId });
    if (shop) {
      return c.json({ hasShop: true, shop });
    } else {
      return c.json({ hasShop: false });
    }
  } catch (error) {
    return c.json({ error: "An error occurred", details: error }, 500);
  }
});

app.post("/create", async (c) => {
  try {
    const { userId, name, description, location } = await c.req.json();

    console.log(userId);

    // Check if the user already has a shop
    const existingShop = await Shop.findOne({ owner: userId });
    if (existingShop) {
      return c.json({ error: "Shop already exists" }, 400);
    }

    // Create a new shop
    const newShop = new Shop({
      name,
      owner: userId,
      description,
      location,
    });
    await newShop.save();

    return c.json({ message: "Shop created successfully", shop: newShop }, 201);
  } catch (error) {
    return c.json({ error: "An error occurred", details: error }, 500);
  }
});

app.post("/regular-customers", async (c) => {
  const { shopName } = await c.req.json(); // Extract shopName from request body

  if (!shopName) {
    return c.json({ error: "Shop name is required" }, 400);
  }

  try {
    const shop = await Shop.findOne({ name: shopName }).select("customers"); // Find shop by name and select only customers

    if (!shop) {
      return c.json({ error: "Shop not found" }, 404);
    }

    return c.json(shop.customers);
  } catch (error) {
    console.error(error);
    return c.json({ error: "An error occurred" }, 500);
  }
});

app.get("/get-all", async (c) => {
  try {
    const shops = await Shop.find()
      .populate("owner", "name") // Populate owner name from the User model
      .populate("products", "name price") // Populate product details (name, price)
      .populate("customers.customerID", "name"); // Populate customer name from the User model

    return c.json(shops, 200); // Return all shops
  } catch (err) {
    if (err instanceof Error) {
      return c.json(
        { error: "Failed to fetch shops", message: err.message },
        500
      );
    }
    return c.json({ error: "An unknown error occurred" }, 500);
  }
});

app.delete("/delete/:id", async (c) => {
  const shopId = c.req.param("id");

  try {
    // Find the shop and populate its products
    const shop = await Shop.findById(shopId).populate("products");

    if (!shop) {
      return c.json({ error: "Shop not found" }, 404);
    }

    // Delete associated products
    await Product.deleteMany({ _id: { $in: shop.products } });

    // Delete the shop
    await Shop.findByIdAndDelete(shopId);

    return c.json({ message: "Shop and its products deleted successfully" });
  } catch (error) {
    console.error("Error deleting shop:", error);
    return c.json({ error: "An error occurred while deleting the shop" }, 500);
  }
});

app.put("/edit/:id", async (c) => {
  const shopId = c.req.param("id");
  const {
    name,
    description,
    location,
    platformDiscount,
    platformShippingDiscount,
  } = await c.req.json();

  try {
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      {
        name,
        description,
        location,
        ...(platformDiscount != null && { platformDiscount }), // Update if provided
        ...(platformShippingDiscount != null && { platformShippingDiscount }), // Update if provided
        updatedAt: Date.now(),
      },
      { new: true } // Return the updated document
    );

    if (!updatedShop) {
      return c.json({ error: "Shop not found" }, 404);
    }

    return c.json({ shop: updatedShop, message: "Shop updated successfully" });
  } catch (error) {
    return c.json({ error: "Failed to update the shop" }, 500);
  }
});

export default app;
