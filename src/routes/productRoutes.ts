import { Hono } from "hono";
import Product from "../models/product.model";
import Shop from "../models/shop.model";

const app = new Hono();

app.post("/add", async (c) => {
  try {
    // Parse JSON body from request
    const {
      shopName, // Shop name used to identify the shop
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

    // Find the shop by its name
    console.log(shopName);
    const shop = await Shop.findOne({ name: brand });

    if (!shop) {
      return c.json(
        {
          success: false,
          message: "Shop not found",
        },
        404
      );
    }

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

    // Add the product's ID to the shop's products array
    shop.products.push(product._id);

    // Save the updated shop document
    await shop.save();

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

app.get("/all", async (c) => {
  try {
    const products = await Product.find();
    return c.json({ success: true, products });
  } catch (error) {
    console.error(error);
    const err = error as Error;
    return c.json(
      {
        success: false,
        message: "Failed to fetch products",
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

app.get("/stocked-products-by-shop", async (c) => {
  const brand = c.req.query("brand"); // Get the brand from query params

  if (!brand) {
    return c.json({ message: "Brand query parameter is required" }, 400);
  }

  try {
    // Query to get products with stockQuantity > 0, status 'in stock', and the specified brand
    const stockedProducts = await Product.find({
      stockQuantity: { $gt: 0 },
      status: "in stock",
      brand: brand, // Add the brand filter
    });

    // Return the filtered products as JSON
    return c.json(stockedProducts);
  } catch (error) {
    console.error("Error fetching stocked products:", error);
    return c.json({ message: "Error fetching stocked products" }, 500);
  }
});

app.get("/best-sellers-by-shop", async (c) => {
  const queryParams = c.req.query();
  const brand = queryParams.brand as string | undefined;

  try {
    // Construct the query object
    const query: { brand?: string } = {};
    if (brand) {
      query.brand = brand; // Filter by brand if provided
    }

    // Query to get the top 20 products for the specified brand, sorted by totalSale in descending order
    const bestSellers = await Product.find(query)
      .sort({ totalSale: -1 })
      .limit(20);

    // Respond with the list of best-selling products
    return c.json(bestSellers);
  } catch (error) {
    // Handle errors
    return c.json({ message: "Internal server error", error }, 500);
  }
});

app.get("/platform/all", async (c) => {
  try {
    const products = await Product.find(); // Fetch all products from the database

    // Calculate platform totals
    const platformTotalSale = products.reduce(
      (acc, product) => acc + product.totalSale,
      0
    );
    const platformTotalSaleValue = products.reduce(
      (acc, product) => acc + product.totalSaleValue,
      0
    );

    return c.json(
      {
        products,
        platformTotalSale,
        platformTotalSaleValue,
      },
      200
    ); // Respond with products and platform-wide totals
  } catch (err) {
    if (err instanceof Error) {
      return c.json(
        { error: "Failed to fetch products", message: err.message },
        500
      );
    }
    return c.json({ error: "An unknown error occurred" }, 500);
  }
});

export default app;
