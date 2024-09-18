import { Hono } from "hono";
import Shop from "../models/shop.model"; // Assuming you have the Shop model defined
import User from "../models/user.model"; // Assuming User model is already imported

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
    console.log(name);
    console.log(description);
    console.log(location);
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

export default app;
