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

app.get("/login", (c) => c.json("Dang nhap"));

export default app;
