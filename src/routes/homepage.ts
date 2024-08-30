import { Hono } from "hono";

const app = new Hono();

app.get("/en", (c) => c.json("Welcome to DLU Underground"));
app.get("/vn", (c) => c.json("Chào mừng bạn đến với DLU Underground"));

export default app;
