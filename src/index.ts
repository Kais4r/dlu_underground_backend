import { Hono } from "hono";
import { cors } from "hono/cors";
import mongoose from "mongoose";

import homepageRoutes from "./routes/homepageRoutes";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import buyerCardRoutes from "./routes/buyerCartRoutes";
import shopRoutes from "./routes/shopRoutes";

const app = new Hono();

// Use CORS middleware
app.use(cors());

const mongoURI =
  "";

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.notFound((c) => {
  return c.text("404 not found error check your api", 404);
});

app.onError((err, c) => {
  console.error(`${err}`);
  return c.text("Nuh uh error code 500" + err, 500);
});

app.get("/", (c) => {
  return c.text("Hello! Welcome to DLU underground");
});

app.route("/homepage", homepageRoutes);
app.route("/user", userRoutes);
app.route("/product", productRoutes);
app.route("/order", orderRoutes);
app.route("/buyerCart", buyerCardRoutes);
app.route("/shop", shopRoutes);

export default {
  port: 3001,
  fetch: app.fetch,
};
