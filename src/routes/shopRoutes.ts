import { Hono } from "hono";
import Shop from "../models/shop.model"; // Assuming you have the Shop model defined
import User from "../models/user.model"; // Assuming User model is already imported
import Order from "../models/order.model";

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

app.get("/customers/regular", async (c) => {
  const minOrders = parseInt(c.req.query("minOrders") || "10"); // Minimum number of orders to be considered regular
  const brand = c.req.query("brand"); // Brand to filter orders by brand

  if (!brand) {
    return c.json({ message: "brand query parameter is required" }, 400);
  }

  try {
    // Build the query filter based on brand
    const orderFilter: any = {};
    if (brand) {
      orderFilter["products.brand"] = brand;
    }

    console.log("Order Filter:", orderFilter); // Debugging line

    // Aggregate orders to count the number of orders per customer
    const customerOrders = await Order.aggregate([
      {
        $match: orderFilter, // Apply filters based on brand
      },
      {
        $group: {
          _id: "$customerID",
          orderCount: { $sum: 1 },
        },
      },
      {
        $match: {
          orderCount: { $gte: minOrders },
        },
      },
      {
        $lookup: {
          from: "users", // Referencing the User model
          localField: "_id",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      {
        $unwind: "$customerDetails",
      },
      {
        $project: {
          _id: 0,
          orderCount: 1,
          customer: "$customerDetails",
        },
      },
    ]);

    console.log("Customer Orders:", customerOrders); // Debugging line

    // Return the list of regular customers
    return c.json(customerOrders);
  } catch (error) {
    console.error("Error fetching regular customers:", error);
    return c.json({ message: "Error fetching regular customers" }, 500);
  }
});
export default app;
