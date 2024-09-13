import { Hono } from "hono";
import { cors } from "hono/cors";
import mongoose from "mongoose";

import homepageRoutes from "./routes/homepageRoutes";
import userRoutes from "./routes/userRoutes";

const app = new Hono();

// Use CORS middleware
app.use(cors());

const mongoURI =
  "mongodb+srv://khoi:l4YUX90EBHnL5TFj@dluunderground.obcrv.mongodb.net/?retryWrites=true&w=majority&appName=DLUUnderground";

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
  return c.text("Nuh uh error code 500", 500);
});

app.get("/", (c) => {
  return c.text("Hello! Welcome to DLU underground");
});

app.route("/homepage", homepageRoutes);
app.route("/user", userRoutes);

export default {
  port: 3001,
  fetch: app.fetch,
};
