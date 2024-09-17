import { Hono } from "hono";
import User from "../models/user.model";
var jwt = require("jsonwebtoken");

const app = new Hono();

//app.get("/signup", (c) => c.json("Dang ky"));

app.post("/signup", async (c) => {
  try {
    const { email, name, password, role } = await c.req.json();

    // Check for error
    // Check if user already exists
    if (!name || !email || !password) {
      return c.json({ error: "Missing fields" }, 500);
    }

    let user = await User.findOne({ email });
    if (user) {
      return c.json({ message: "User already exists" }, 400);
    }

    // Finish checking - create a new user
    user = new User({ email, name, password, role });
    await user.save();

    // assign jwt

    return c.json({ message: "User created successfully", user }, 201);
  } catch (error) {
    return c.json({ message: "Error creating user", error }, 500);
  }
});

// Login endpoint
app.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Check if both email and password are provided
    if (!email || !password) {
      return c.json({ error: "Missing email or password" }, 400);
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 400);
    }

    // Check if the password matches
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   return c.json({ error: "Invalid email or password" }, 400);
    // }

    if (password !== user.password) {
      return c.json({ error: "Invalid email or password" }, 400);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      "your_jwt_secret_key",
      { expiresIn: "1h" } // Set token expiration
    );

    // Return the token

    return c.json(
      {
        message: "Login successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          dluCoin: user.dluCoin,
        },
        token,
      },
      200
    );
  } catch (error) {
    return c.json({ message: "Error logging in", error }, 500);
  }
});
//app.get("/login", (c) => c.json("Dang nhap"));

app.get("/get/:id", async (c) => {
  try {
    const userId = c.req.param("id"); // Access the route parameter correctly

    if (!userId) {
      return c.json({ success: false, message: "User ID is required" }, 400);
    }

    const user = await User.findById(userId).select("-password"); // Exclude password from the response

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    return c.json({ success: true, user });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      return c.json(
        { success: false, message: "An error occurred", error: error.message },
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
