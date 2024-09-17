import { Hono } from "hono";
import Product from "../models/product.model";

const app = new Hono();

app.post("/add", async (c) => {
  try {
    // Parse JSON body from request
    const {
      name,
      description,
      price,
      category,
      brand,
      sku,
      stockQuantity,
      images,
      thumbnailImage,
      weight,
      dimensions,
      color,
      size,
      material,
      rating,
      reviews,
      status,
      discount,
      tags,
      supplierID,
      warranty,
      shippingDetails,
    } = await c.req.json();

    // Create a new product instance using the Mongoose model
    const product = new Product({
      name,
      description,
      price,
      category,
      brand,
      sku,
      stockQuantity,
      images,
      thumbnailImage,
      weight,
      dimensions,
      color,
      size,
      material,
      rating,
      reviews,
      status,
      discount,
      tags,
      supplierID,
      warranty,
      shippingDetails,
    });

    // Save the product to the database
    await product.save();

    return c.json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    const err = error as Error;
    return c.json(
      {
        success: false,
        message: "Failed to add product",
        error: err.message,
      },
      500
    );
  }
});

app.get("/on-sale", async (c) => {
  try {
    // Query for products with a discount greater than 0
    const onSaleProducts = await Product.find({ discount: { $gt: 0 } });

    return c.json({
      success: true,
      message: "On-sale products fetched successfully",
      products: onSaleProducts,
    });
  } catch (error) {
    console.error(error);
    const err = error as Error;
    return c.json(
      {
        success: false,
        message: "Failed to fetch on-sale products",
        error: err.message,
      },
      500
    );
  }
});

app.get("/get/:id", async (c) => {
  try {
    const productID = c.req.param("id"); // Get product ID from the request params

    // Query the product by its ID
    const product = await Product.findById(productID);

    if (!product) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Product fetched successfully",
      product: product,
    });
  } catch (error) {
    console.error(error);
    const err = error as Error;
    return c.json(
      {
        success: false,
        message: "Failed to fetch product",
        error: err.message,
      },
      500
    );
  }
});

export default app;
